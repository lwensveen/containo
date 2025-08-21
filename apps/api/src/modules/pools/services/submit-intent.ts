import { db, poolItemsTable } from '@containo/db';
import { assignOneItemTx } from './assign-one-item.js';

export type Input = {
  userId: string;
  originPort: string;
  destPort: string;
  mode: 'sea' | 'air';
  cutoffAt: Date;
  weightKg: number;
  dimsCm: { length: number; width: number; height: number };
};

export async function submitIntent(input: Input) {
  const { userId, originPort, destPort, mode, cutoffAt, weightKg, dimsCm } = input;
  const volumeM3 = (dimsCm.length * dimsCm.width * dimsCm.height) / 1_000_000;

  const [row] = await db
    .insert(poolItemsTable)
    .values({
      status: 'pending',
      userId,
      originPort,
      destPort,
      mode,
      cutoffAt,
      weightKg: String(weightKg),
      volumeM3: String(volumeM3),
      length: String(dimsCm.length),
      width: String(dimsCm.width),
      height: String(dimsCm.height),
    })
    .returning({ id: poolItemsTable.id });

  if (!row?.id) throw new Error('Failed to create pool item');

  await assignOneItemTx(row.id);

  return { id: row.id, volumeM3 };
}
