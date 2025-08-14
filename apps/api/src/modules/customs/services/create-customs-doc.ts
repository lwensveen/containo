import { customsDocLinesTable, customsDocsTable, db } from '@containo/db';
import { emitPoolEvent } from '../../events/services/emit-pool-event.js';
import { genDocNumber } from '../utils.js';
import {
  type CustomsDocCreate,
  CustomsDocCreateSchema,
  type CustomsDocRecord,
  CustomsDocRecordSchema,
} from '@containo/types';

export async function createCustomsDoc(input: CustomsDocCreate): Promise<CustomsDocRecord> {
  const data = CustomsDocCreateSchema.parse(input);

  return db.transaction(async (tx) => {
    const totalValue = data.lines.reduce(
      (sum, l) => sum + Number(l.unitValue) * Number(l.quantity ?? 1),
      0
    );

    const [doc] = await tx
      .insert(customsDocsTable)
      .values({
        poolId: data.poolId,
        docNumber: data.docNumber ?? genDocNumber(),
        exporterName: data.exporterName,
        exporterAddress: data.exporterAddress,
        importerName: data.importerName,
        importerAddress: data.importerAddress,
        incoterm: data.incoterm,
        currency: data.currency,
        totalValue: String(totalValue),
        notes: data.notes ?? null,
      })
      .returning();

    if (!doc) throw new Error('Failed to create Customs doc');

    const lineRows = await Promise.all(
      data.lines.map((l, i) =>
        tx
          .insert(customsDocLinesTable)
          .values({
            docId: doc.id,
            position: i + 1,
            description: l.description,
            hsCode: l.hsCode ?? null,
            originCountry: l.originCountry ?? null,
            quantity: l.quantity ?? 1,
            unitWeightKg: String(l.unitWeightKg ?? l.unitGrossWeightKg ?? 0),
            unitGrossWeightKg:
              l.unitGrossWeightKg !== undefined ? String(l.unitGrossWeightKg) : null,
            unitNetWeightKg: l.unitNetWeightKg !== undefined ? String(l.unitNetWeightKg) : null,
            unitValue: String(l.unitValue),
            itemId: l.itemId ?? null,
          })
          .returning()
      )
    ).then((xs) => xs.flat());

    await emitPoolEvent({
      poolId: doc.poolId,
      type: 'customs_ready',
      payload: { docId: doc.id, docNumber: doc.docNumber, kind: 'invoice_and_packing' },
    });

    return CustomsDocRecordSchema.parse({
      ...doc,
      lines: lineRows
        .sort((a, b) => a.position - b.position)
        .map((l) => ({
          id: l.id,
          position: l.position,
          description: l.description,
          hsCode: l.hsCode,
          originCountry: l.originCountry,
          quantity: l.quantity,
          unitWeightKg: l.unitWeightKg,
          unitGrossWeightKg: l.unitGrossWeightKg,
          unitNetWeightKg: l.unitNetWeightKg,
          unitValue: l.unitValue,
          itemId: l.itemId,
        })),
    });
  });
}
