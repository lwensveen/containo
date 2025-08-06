import type { FastifyBaseLogger } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { db, poolItemsTable, poolsTable } from '@containo/db';
import { ENV } from '../../../env.js';
import { expectOne } from '../utils.js';
import { emitPoolEvent } from '../../events/services/emit-pool-event.js';

export async function assignPendingItemsToPools(log: FastifyBaseLogger) {
  const pending = await db
    .select()
    .from(poolItemsTable)
    .where(eq(poolItemsTable.status, 'pending'));
  if (!pending.length) return 0;

  let changed = 0;

  for (const it of pending) {
    const capDefault = it.mode === 'sea' ? ENV.POOL_SEA_CAP_M3 : ENV.POOL_AIR_CAP_M3;

    const found = await db
      .select()
      .from(poolsTable)
      .where(
        and(
          eq(poolsTable.originPort, it.originPort),
          eq(poolsTable.destPort, it.destPort),
          eq(poolsTable.mode, it.mode),
          eq(poolsTable.cutoffISO, it.cutoffISO),
          eq(poolsTable.status, 'open')
        )
      );

    let pool = found[0];

    if (!pool) {
      const created = await db
        .insert(poolsTable)
        .values({
          originPort: it.originPort,
          destPort: it.destPort,
          mode: it.mode,
          cutoffISO: it.cutoffISO,
          capacityM3: String(capDefault),
          usedM3: '0',
          status: 'open',
        })
        .returning();

      pool = expectOne(created, 'Failed to create pool for lane');

      await emitPoolEvent({
        poolId: pool.id,
        type: 'pool_created',
        payload: {
          originPort: pool.originPort,
          destPort: pool.destPort,
          mode: pool.mode,
          cutoffISO: pool.cutoffISO,
          capacityM3: pool.capacityM3,
        },
      });
    }

    const used = Number(pool.usedM3);
    const vol = Number(it.volumeM3);
    const capN = Number(pool.capacityM3);

    const beforeFill = used / capN;
    const afterUsed = used + vol;

    if (afterUsed <= capN) {
      await db
        .update(poolItemsTable)
        .set({ status: 'pooled', poolId: pool.id })
        .where(eq(poolItemsTable.id, it.id));
      await db
        .update(poolsTable)
        .set({ usedM3: String(afterUsed) })
        .where(eq(poolsTable.id, pool.id));

      changed++;
      log.info({ pool: pool.id, item: it.id }, 'pooled item');

      await emitPoolEvent({
        poolId: pool.id,
        type: 'item_pooled',
        payload: {
          itemId: it.id,
          addedVolumeM3: it.volumeM3,
          usedM3: String(afterUsed),
          capacityM3: pool.capacityM3,
        },
      });

      const afterFill = afterUsed / capN;

      if (beforeFill < 0.8 && afterFill >= 0.8) {
        await emitPoolEvent({ poolId: pool.id, type: 'fill_80', payload: { fill: afterFill } });
      }
      if (beforeFill < 0.9 && afterFill >= 0.9) {
        await emitPoolEvent({ poolId: pool.id, type: 'fill_90', payload: { fill: afterFill } });
        if (pool.status === 'open') {
          await db.update(poolsTable).set({ status: 'closing' }).where(eq(poolsTable.id, pool.id));
          await emitPoolEvent({
            poolId: pool.id,
            type: 'status_changed',
            payload: { status: 'closing' },
          });
          log.info({ pool: pool.id, fill: afterFill }, 'pool >= 90%, mark closing');
        }
      }
      if (afterFill >= 1.0) {
        await emitPoolEvent({ poolId: pool.id, type: 'fill_100', payload: { fill: afterFill } });
      }
    }
  }

  return changed;
}
