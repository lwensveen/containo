import { and, eq, sql } from 'drizzle-orm';
import { db, inboundParcelsTable, poolItemsTable, poolsTable } from '@containo/db';
import { findNextOpenPoolIdForLane } from '../../lanes/services.js';

function toM3(l?: number | null, w?: number | null, h?: number | null) {
  if (l == null || w == null || h == null) return 0;
  return (Number(l) * Number(w) * Number(h)) / 1_000_000;
}

export async function convertPaidInboundToPoolItem(args: {
  inboundId: string;
  stripeSessionId?: string | null;
}) {
  const { inboundId, stripeSessionId = null } = args;

  return await db.transaction(async (tx) => {
    const [inb] = await tx
      .select()
      .from(inboundParcelsTable)
      .where(eq(inboundParcelsTable.id, inboundId))
      .limit(1);

    if (!inb) throw new Error('Inbound not found');

    if (stripeSessionId) {
      const exists = await tx
        .select({ id: poolItemsTable.id })
        .from(poolItemsTable)
        .where(eq(poolItemsTable.stripeSessionId, stripeSessionId))
        .limit(1);
      if (exists.length) return { poolItemId: exists[0]!.id, poolId: inb.poolId ?? null };
    }

    const volumeM3 = toM3(inb.lengthCm, inb.widthCm, inb.heightCm);
    const weightKg = inb.weightKg ? Number(inb.weightKg) : 0;

    const poolId =
      inb.poolId ??
      (await findNextOpenPoolIdForLane({
        originPort: inb.originPort,
        destPort: inb.destPort,
        mode: inb.mode as 'air' | 'sea',
      }).catch(() => null));

    const items = await tx
      .insert(poolItemsTable)
      .values({
        userId: inb.userId,
        poolId: poolId ?? null,
        originPort: inb.originPort,
        destPort: inb.destPort,
        mode: inb.mode as any,
        stripeSessionId: stripeSessionId ?? null,
        cutoffAt: inb.freeUntilAt ? new Date(inb.freeUntilAt) : new Date(),
        weightKg: String(weightKg),
        volumeM3: String(volumeM3),
        length: String(inb.lengthCm ?? 0),
        width: String(inb.widthCm ?? 0),
        height: String(inb.heightCm ?? 0),
        status: 'paid',
      })
      .returning({ id: poolItemsTable.id, poolId: poolItemsTable.poolId });

    const item = items[0];
    if (!item) throw new Error('Failed to create pool item');

    if (item.poolId && volumeM3 > 0) {
      await tx
        .update(poolsTable)
        .set({
          usedM3: sql`${poolsTable.usedM3} + ${String(volumeM3)}`,
          updatedAt: new Date(),
        })
        .where(eq(poolsTable.id, item.poolId));
    }

    await tx
      .update(inboundParcelsTable)
      .set({
        status: inb.poolId || poolId ? ('pooled' as any) : ('paid' as any),
        poolId: inb.poolId ?? poolId ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(inboundParcelsTable.id, inboundId)));

    return { poolItemId: item.id, poolId: item.poolId ?? null };
  });
}
