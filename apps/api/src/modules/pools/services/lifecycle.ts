import { and, eq, lte } from 'drizzle-orm';
import { db, poolsTable } from '@containo/db';
import { emitPoolEvent } from '../../events/services/emit-pool-event.js';

export async function closeExpiredOpenPools() {
  const now = new Date();
  const updated = await db
    .update(poolsTable)
    .set({ status: 'closing', updatedAt: new Date() })
    .where(and(eq(poolsTable.status, 'open'), lte(poolsTable.cutoffAt, now)))
    .returning({ id: poolsTable.id });

  for (const r of updated) {
    await emitPoolEvent({ poolId: r.id, type: 'status_changed', payload: { status: 'closing' } });
  }

  return updated.length;
}

export async function bookClosingPools(graceHours: number) {
  const cutoffBefore = new Date(Date.now() - graceHours * 3600_000);
  const updated = await db
    .update(poolsTable)
    .set({ status: 'booked', updatedAt: new Date() })
    .where(and(eq(poolsTable.status, 'closing'), lte(poolsTable.cutoffAt, cutoffBefore)))
    .returning({ id: poolsTable.id });

  for (const r of updated) {
    await emitPoolEvent({ poolId: r.id, type: 'status_changed', payload: { status: 'booked' } });
  }

  return updated.length;
}
