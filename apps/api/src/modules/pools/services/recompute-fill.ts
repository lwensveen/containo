import { and, eq, inArray } from 'drizzle-orm';
import { db, poolItemsTable, poolsTable } from '@containo/db';
import { emitPoolEvent } from '../../events/services/emit-pool-event.js';

const ACTIVE_ITEM_STATUSES = ['pending', 'pooled', 'pay_pending', 'paid', 'shipped'] as const;

export async function recomputePoolFill(poolId: string) {
  const [pool] = await db.select().from(poolsTable).where(eq(poolsTable.id, poolId)).limit(1);
  if (!pool) return null;

  const prevUsed = Number(pool.usedM3 ?? 0);
  const capacity = Number(pool.capacityM3 ?? 0);

  const items = await db
    .select({ volumeM3: poolItemsTable.volumeM3 })
    .from(poolItemsTable)
    .where(
      and(eq(poolItemsTable.id, poolId), inArray(poolItemsTable.status, ACTIVE_ITEM_STATUSES))
    );

  const used = items.reduce((s, it) => s + Number(it.volumeM3 ?? 0), 0);
  const usedStr = String(used);

  if (usedStr !== String(pool.usedM3 ?? '0')) {
    await db
      .update(poolsTable)
      .set({ usedM3: usedStr, updatedAt: new Date() })
      .where(eq(poolsTable.id, poolId));
  }

  if (capacity > 0) {
    const prev = Math.min(1, Math.max(0, prevUsed / capacity));
    const curr = Math.min(1, Math.max(0, used / capacity));

    type T = { t: number; type: 'fill_80' | 'fill_90' | 'fill_100' };
    const steps: T[] = [
      { t: 0.8, type: 'fill_80' },
      { t: 0.9, type: 'fill_90' },
      { t: 1.0, type: 'fill_100' },
    ];

    for (const s of steps) {
      if (prev < s.t && curr >= s.t) {
        await emitPoolEvent({
          poolId,
          type: s.type,
          payload: { prev, curr, capacityM3: capacity, usedM3: used },
        });
      }
    }
  }

  return {
    usedM3: usedStr,
    capacityM3: String(pool.capacityM3 ?? '0'),
    fill: capacity ? used / capacity : 0,
  };
}
