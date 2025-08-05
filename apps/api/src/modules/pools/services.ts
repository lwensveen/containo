import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { items, pools } from '../../db/schema';
import type { FastifyBaseLogger } from 'fastify';
import { ENV } from '../../env';
import { expectOne } from './utils';

export async function listPools() {
  return db.select().from(pools);
}

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

export async function assignPendingItemsToPools(log: FastifyBaseLogger) {
  const pending = await db.select().from(items).where(eq(items.status, 'pending'));

  if (!pending.length) return 0;

  let changed = 0;

  for (const it of pending) {
    const capDefault = it.mode === 'sea' ? ENV.POOL_SEA_CAP_M3 : ENV.POOL_AIR_CAP_M3;

    let [pool] = await db
      .select()
      .from(pools)
      .where(
        and(
          eq(pools.originPort, it.originPort),
          eq(pools.destPort, it.destPort),
          eq(pools.mode, it.mode),
          eq(pools.cutoffISO, it.cutoffISO),
          eq(pools.status, 'open')
        )
      );

    if (!pool) {
      pool = expectOne(
        await db
          .insert(pools)
          .values({
            originPort: it.originPort,
            destPort: it.destPort,
            mode: it.mode,
            cutoffISO: it.cutoffISO,
            capacityM3: String(capDefault),
            usedM3: '0',
            status: 'open',
          })
          .returning(),
        'Failed to create pool for lane'
      );
    }

    const used = Number(pool.usedM3);
    const vol = Number(it.volumeM3);
    const capN = Number(pool.capacityM3);

    if (used + vol <= capN) {
      await db.update(items).set({ status: 'pooled', poolId: pool.id }).where(eq(items.id, it.id));

      await db
        .update(pools)
        .set({ usedM3: String(used + vol) })
        .where(eq(pools.id, pool.id));

      changed++;
      log.info({ pool: pool.id, item: it.id }, 'pooled item');

      const newFill = (used + vol) / capN;
      if (newFill >= 0.9 && pool.status === 'open') {
        await db.update(pools).set({ status: 'closing' }).where(eq(pools.id, pool.id));
        log.info({ pool: pool.id, fill: newFill }, 'pool >= 90%, mark closing');
      }
    }
  }

  return changed;
}
