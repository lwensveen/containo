import { db, poolItemsTable } from '@containo/db';
import { eq } from 'drizzle-orm';
import { fingerprint } from '../utils.js';
import { assignOneItemTx } from './assign-one-item.js';

export type Input = {
  userId: string;
  originPort: string;
  destPort: string;
  mode: 'sea' | 'air';
  cutoffISO: string;
  weightKg: number;
  dimsCm: { length: number; width: number; height: number };
  idempotencyKey?: string | null;
};

export async function submitIntent(input: Input) {
  const { userId, originPort, destPort, mode, cutoffISO, weightKg, dimsCm } = input;
  const volumeM3 = (dimsCm.length * dimsCm.width * dimsCm.height) / 1_000_000;
  const idem = input.idempotencyKey ?? fingerprint(input);

  const [row] = await db
    .insert(poolItemsTable)
    .values({
      idempotencyKey: idem,
      status: 'pending',
      userId,
      originPort,
      destPort,
      mode,
      cutoffISO,
      weightKg: String(weightKg),
      volumeM3: String(volumeM3),
      length: String(dimsCm.length),
      width: String(dimsCm.width),
      height: String(dimsCm.height),
    })
    .onConflictDoNothing({ target: poolItemsTable.idempotencyKey })
    .returning({ id: poolItemsTable.id });

  let id = row?.id;

  if (!id) {
    const existing = await db
      .select({ id: poolItemsTable.id })
      .from(poolItemsTable)
      .where(eq(poolItemsTable.idempotencyKey, idem))
      .limit(1);
    id = existing[0]?.id;
  }

  if (!id) throw new Error('Failed to insert or fetch idempotent pool item');

  await assignOneItemTx(id);

  return { id, volumeM3 };
}
