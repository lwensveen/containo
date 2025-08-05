import { db } from '../../../db/client';
import { items } from '../../../db/schema';
import { expectOne } from '../utils';

export async function submitIntent(input: {
  userId: string;
  originPort: string;
  destPort: string;
  mode: 'sea' | 'air';
  cutoffISO: string;
  weightKg: number;
  dimsCm: { length: number; width: number; height: number };
}) {
  const { userId, originPort, destPort, mode, cutoffISO, weightKg, dimsCm } = input;
  const volumeM3 = (dimsCm.length * dimsCm.width * dimsCm.height) / 1_000_000;

  const row = expectOne(
    await db
      .insert(items)
      .values({
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
      .returning({ id: items.id }),
    'Failed to insert item intent'
  );

  return { id: row.id, volumeM3 };
}
