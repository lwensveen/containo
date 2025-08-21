import PdfPrinter from 'pdfmake';
import { z } from 'zod/v4';
import type { CustomsDocRecord } from '@containo/types';
import {
  CustomsDocLineSelectCoercedSchema,
  CustomsDocRecordSchema,
  CustomsDocSelectCoercedSchema,
} from '@containo/types';

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

function money(n: number, ccy: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy || 'USD' }).format(n);
}

type ImagesMap = Record<string, string | Buffer>;

function coerceRecord(input: unknown): CustomsDocRecord {
  const record = CustomsDocRecordSchema.parse(input);
  const docCoerced = CustomsDocSelectCoercedSchema.parse(record);
  const linesCoerced = z.array(CustomsDocLineSelectCoercedSchema).parse(record.lines);

  return { ...docCoerced, lines: linesCoerced };
}

export async function renderCustomsPdf(
  input: unknown,
  kind: 'invoice' | 'packing',
  opts?: { images?: ImagesMap }
): Promise<Buffer> {
  const doc = coerceRecord(input);

  const printer = new PdfPrinter(fonts as any);

  const totalWeight = doc.lines.reduce((s, l) => {
    const qty = Number(l.quantity || 1);
    const u = Number(l.unitWeightKg ?? l.unitGrossWeightKg ?? 0);
    return s + u * qty;
  }, 0);

  const totalValue = doc.lines.reduce((s, l) => {
    const qty = Number(l.quantity || 1);
    const u = Number(l.unitValue ?? 0);
    return s + u * qty;
  }, 0);

  const headerRow =
    kind === 'invoice'
      ? ['Description', 'HS', 'Qty', 'Unit Value', 'Line Total']
      : ['Description', 'HS', 'Qty', 'Gross (kg)', 'Net (kg)'];

  const tableBody = [
    headerRow.map((h) => ({
      text: h,
      style: 'th',
      alignment: ['Qty', 'Unit Value', 'Line Total', 'Gross (kg)', 'Net (kg)'].includes(h)
        ? 'right'
        : 'left',
    })),
    ...doc.lines.map((l) => {
      const qty = Number(l.quantity || 1);
      const unitVal = Number(l.unitValue ?? 0);
      const unitGross = Number(l.unitGrossWeightKg ?? l.unitWeightKg ?? 0);
      const unitNet = Number(l.unitNetWeightKg ?? 0);

      return kind === 'invoice'
        ? [
            { text: l.description, style: 'td' },
            { text: l.hsCode ?? '', style: 'td' },
            { text: String(qty), style: 'td', alignment: 'right' },
            { text: money(unitVal, doc.currency), style: 'td', alignment: 'right' },
            { text: money(qty * unitVal, doc.currency), style: 'td', alignment: 'right' },
          ]
        : [
            { text: l.description, style: 'td' },
            { text: l.hsCode ?? '', style: 'td' },
            { text: String(qty), style: 'td', alignment: 'right' },
            { text: unitGross.toFixed(2), style: 'td', alignment: 'right' },
            { text: (unitNet || 0).toFixed(2), style: 'td', alignment: 'right' },
          ];
    }),
  ];

  const docDefinition: any = {
    defaultStyle: { font: 'Helvetica', fontSize: 9 },
    pageMargins: [40, 40, 40, 40],
    images: opts?.images,
    content: [
      { text: 'CONTAINO LOGISTICS', bold: true, margin: [0, 0, 0, 2] },
      { text: kind === 'invoice' ? 'COMMERCIAL INVOICE' : 'PACKING LIST', style: 'h1' },
      {
        columns: [
          [
            { text: `Document No: ${doc.docNumber ?? doc.id}`, margin: [0, 6, 0, 0] },
            { text: `Date: ${new Date(doc.createdAt!).toISOString().slice(0, 10)}` },
          ],
          [
            { text: `Incoterm: ${doc.incoterm}`, alignment: 'right', margin: [0, 6, 0, 0] },
            { text: `Currency: ${doc.currency}`, alignment: 'right' },
          ],
        ],
      },
      {
        columns: [
          [
            { text: 'Exporter', style: 'h2' },
            { text: doc.exporterName },
            { text: doc.exporterAddress },
          ],
          [
            { text: 'Importer', style: 'h2', alignment: 'right' },
            { text: doc.importerName, alignment: 'right' },
            { text: doc.importerAddress, alignment: 'right' },
          ],
        ],
        margin: [0, 10, 0, 4],
      },
      {
        table: { headerRows: 1, widths: ['*', 60, 40, 60, 60], body: tableBody },
        layout: 'lightHorizontalLines',
      },
      kind === 'invoice'
        ? {
            text: `Total: ${money(totalValue, doc.currency)}`,
            style: 'total',
            margin: [0, 8, 0, 0],
          }
        : {
            text: `Total Weight: ${totalWeight.toFixed(2)} kg`,
            style: 'total',
            margin: [0, 8, 0, 0],
          },
      doc.notes ? { text: `Notes:\n${doc.notes}`, margin: [0, 8, 0, 0] } : undefined,
      opts?.images?.stamp
        ? {
            columns: [
              { text: 'Signature:', margin: [0, 24, 0, 0] },
              { image: 'stamp', width: 100, alignment: 'right', margin: [0, 16, 0, 0] },
            ],
          }
        : { text: 'Signature: ____________________________', margin: [0, 24, 0, 0] },
    ].filter(Boolean),
    styles: {
      h1: { fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
      h2: { bold: true, margin: [0, 8, 0, 2] },
      th: { bold: true, fillColor: '#f3f4f6', margin: [0, 4, 0, 4] },
      td: { margin: [0, 2, 0, 2] },
      total: { bold: true },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    pdfDoc.on('data', (d: Buffer) => chunks.push(d));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}
