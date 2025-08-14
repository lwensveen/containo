import { db, poolItemsTable, poolsTable } from '@containo/db';
import { desc, eq } from 'drizzle-orm';

export async function listShipmentsByUser(userId: string, limit = 100) {
  const rows = await db
    .select({
      itemId: poolItemsTable.id,
      poolId: poolItemsTable.poolId,
      status: poolItemsTable.status,
      weightKg: poolItemsTable.weightKg,
      volumeM3: poolItemsTable.volumeM3,
      length: poolItemsTable.length,
      width: poolItemsTable.width,
      height: poolItemsTable.height,
      createdAt: poolItemsTable.createdAt,
      originPort: poolsTable.originPort,
      destPort: poolsTable.destPort,
      mode: poolsTable.mode,
      cutoffISO: poolsTable.cutoffISO,
      poolStatus: poolsTable.status,
      capacityM3: poolsTable.capacityM3,
      usedM3: poolsTable.usedM3,
    })
    .from(poolItemsTable)
    .leftJoin(poolsTable, eq(poolItemsTable.poolId, poolsTable.id))
    .where(eq(poolItemsTable.userId, userId))
    .orderBy(desc(poolItemsTable.createdAt))
    .limit(limit);

  return rows.map((row) => {
    const cap = row.capacityM3 ? Number(row.capacityM3) : null;
    const used = row.usedM3 ? Number(row.usedM3) : null;
    const fillPercent = cap && used && cap > 0 ? Math.max(0, Math.min(1, used / cap)) : null;

    return {
      ...row,
      weightKg: Number(row.weightKg),
      volumeM3: Number(row.volumeM3),
      length: Number(row.length),
      width: Number(row.width),
      height: Number(row.height),
      fillPercent,
    };
  });
}
