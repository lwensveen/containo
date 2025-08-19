import { eq, sql } from 'drizzle-orm';
import { db, poolItemsTable, poolsTable } from '@containo/db';
import { emitPoolEvent } from '../../events/services/emit-pool-event.js';
import { toNumber } from '../utils.js';

export async function assignOneItemTx(itemId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [it] = await tx
      .select()
      .from(poolItemsTable)
      .where(eq(poolItemsTable.id, itemId))
      .limit(1);

    if (!it || it.status !== 'pending') return false;

    const [pool] = (await tx.execute(sql`
      SELECT * FROM ${poolsTable}
      WHERE ${poolsTable.originPort} = ${it.originPort}
        AND ${poolsTable.destPort}  = ${it.destPort}
        AND ${poolsTable.mode}      = ${it.mode}
        AND ${poolsTable.cutoffAt} = ${it.cutoffAt}
        AND ${poolsTable.status}    = 'open'
      ORDER BY ${poolsTable.createdAt} ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `)) as any[];

    let p = pool;

    if (!p) {
      const capDefault = it.mode === 'sea' ? 28 : 4;

      try {
        const inserted = await tx
          .insert(poolsTable)
          .values({
            originPort: it.originPort,
            destPort: it.destPort,
            mode: it.mode,
            cutoffAt: it.cutoffAt,
            capacityM3: String(capDefault),
            usedM3: '0',
            status: 'open',
          })
          .returning();
        p = inserted[0];

        await emitPoolEvent({
          poolId: p.id,
          type: 'pool_created',
          payload: {
            originPort: p.originPort,
            destPort: p.destPort,
            mode: p.mode,
            cutoffAt: p.cutoffAt,
            capacityM3: p.capacityM3,
          },
        });
      } catch {
        const [locked] = (await tx.execute(sql`
          SELECT * FROM ${poolsTable}
          WHERE ${poolsTable.originPort} = ${it.originPort}
            AND ${poolsTable.destPort}  = ${it.destPort}
            AND ${poolsTable.mode}      = ${it.mode}
            AND ${poolsTable.cutoffAt} = ${it.cutoffAt}
            AND ${poolsTable.status}    = 'open'
          ORDER BY ${poolsTable.createdAt} ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `)) as any[];
        p = locked;
        if (!p) return false;
      }
    }

    const used = toNumber(p.usedM3);
    const cap = toNumber(p.capacityM3);
    const vol = toNumber(it.volumeM3);
    const beforeFill = used / cap;
    const afterUsed = used + vol;

    if (afterUsed > cap) {
      return false;
    }

    await tx
      .update(poolItemsTable)
      .set({ status: 'pooled', poolId: p.id })
      .where(eq(poolItemsTable.id, it.id));

    await tx
      .update(poolsTable)
      .set({ usedM3: String(afterUsed) })
      .where(eq(poolsTable.id, p.id));

    await emitPoolEvent({
      poolId: p.id,
      type: 'item_pooled',
      payload: {
        itemId: it.id,
        addedVolumeM3: it.volumeM3,
        usedM3: String(afterUsed),
        capacityM3: p.capacityM3,
      },
    });

    const afterFill = afterUsed / cap;

    if (beforeFill < 0.8 && afterFill >= 0.8) {
      await emitPoolEvent({ poolId: p.id, type: 'fill_80', payload: { fill: afterFill } });
    }

    if (beforeFill < 0.9 && afterFill >= 0.9) {
      await emitPoolEvent({ poolId: p.id, type: 'fill_90', payload: { fill: afterFill } });
      if (p.status === 'open') {
        await tx.update(poolsTable).set({ status: 'closing' }).where(eq(poolsTable.id, p.id));
        await emitPoolEvent({
          poolId: p.id,
          type: 'status_changed',
          payload: { status: 'closing' },
        });
      }
    }

    if (afterFill >= 1.0) {
      await emitPoolEvent({ poolId: p.id, type: 'fill_100', payload: { fill: afterFill } });
    }

    return true;
  });
}
