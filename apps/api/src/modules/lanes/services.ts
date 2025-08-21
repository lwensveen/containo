import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, poolsTable } from '@containo/db';
import { z } from 'zod';

export type NextLanePool = {
  id: string;
  originPort: string;
  destPort: string;
  mode: 'air' | 'sea';
  cutoffAt: Date;
  capacityM3: string;
  usedM3: string;
  status: string;
  fillPercent: number;
  secondsToCutoff: number;
};

export const createPoolInput = z.object({
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['air', 'sea']),
  cutoffAt: z.date(),
  capacityM3: z.number().positive(),
  bookingRef: z.string().optional(),
});

export type CreatePoolInput = z.infer<typeof createPoolInput>;

export async function getNextOpenPool(args: {
  originPort: string;
  destPort: string;
  mode: 'air' | 'sea';
}): Promise<NextLanePool | null> {
  const { originPort, destPort, mode } = args;

  const rows = await db
    .select()
    .from(poolsTable)
    .where(
      and(
        eq(poolsTable.originPort, originPort.toUpperCase()),
        eq(poolsTable.destPort, destPort.toUpperCase()),
        eq(poolsTable.mode, mode),
        eq(poolsTable.status, 'open')
      )
    )
    .orderBy(asc(poolsTable.cutoffAt))
    .limit(1);

  const p = rows[0];
  if (!p) return null;

  const capacity = Number(p.capacityM3 ?? 0);
  const used = Number(p.usedM3 ?? 0);
  const cutoff = new Date(String(p.cutoffAt)).getTime();
  const fillPercent = capacity > 0 ? Math.max(0, Math.min(1, used / capacity)) : 0;
  const secondsToCutoff = Math.max(0, Math.floor((cutoff - Date.now()) / 1000));

  return {
    id: p.id,
    originPort: p.originPort,
    destPort: p.destPort,
    mode: p.mode as 'air' | 'sea',
    cutoffAt: p.cutoffAt,
    capacityM3: String(p.capacityM3 ?? '0'),
    usedM3: String(p.usedM3 ?? '0'),
    status: p.status,
    fillPercent,
    secondsToCutoff,
  };
}

/** Helper for inbound linking */
export async function findNextOpenPoolIdForLane(args: {
  originPort: string;
  destPort: string;
  mode: 'air' | 'sea';
}): Promise<string | null> {
  const next = await getNextOpenPool(args);
  return next?.id ?? null;
}

export async function createPool(input: CreatePoolInput) {
  const data = createPoolInput.parse(input);
  const origin = data.originPort.toUpperCase();
  const dest = data.destPort.toUpperCase();

  const inserted = await db
    .insert(poolsTable)
    .values({
      originPort: origin,
      destPort: dest,
      mode: data.mode,
      cutoffAt: data.cutoffAt,
      capacityM3: String(data.capacityM3),
      usedM3: '0',
      status: 'open',
      bookingRef: data.bookingRef ?? null,
    })
    .onConflictDoNothing({
      target: [poolsTable.originPort, poolsTable.destPort, poolsTable.mode, poolsTable.cutoffAt],
    })
    .returning({ id: poolsTable.id });

  if (inserted.length > 0) {
    return { id: inserted[0]!.id, duplicate: false as const };
  }

  const [existing] = await db
    .select({ id: poolsTable.id })
    .from(poolsTable)
    .where(
      and(
        eq(poolsTable.originPort, origin),
        eq(poolsTable.destPort, dest),
        eq(poolsTable.mode, data.mode),
        eq(poolsTable.cutoffAt, data.cutoffAt)
      )
    )
    .limit(1);

  if (!existing) throw new Error('Pool exists but could not be retrieved');

  return { id: existing.id, duplicate: true as const };
}

export async function listPools(args: {
  originPort?: string;
  destPort?: string;
  mode?: 'air' | 'sea';
  status?: Array<'open' | 'closing' | 'booked' | 'in_transit' | 'arrived'>;
  limit?: number;
}) {
  const { originPort, destPort, mode, status, limit = 50 } = args;

  const where = and(
    originPort ? eq(poolsTable.originPort, originPort.toUpperCase()) : sql`true`,
    destPort ? eq(poolsTable.destPort, destPort.toUpperCase()) : sql`true`,
    mode ? eq(poolsTable.mode, mode) : sql`true`,
    status && status.length ? inArray(poolsTable.status, status as any) : sql`true`
  );

  const rows = await db
    .select()
    .from(poolsTable)
    .where(where)
    .orderBy(desc(poolsTable.cutoffAt))
    .limit(limit);

  return rows.map((p) => ({
    ...p,
    capacityM3: String(p.capacityM3 ?? '0'),
    usedM3: String(p.usedM3 ?? '0'),
  }));
}

export const updatePoolInput = z.object({
  status: z.enum(['open', 'closing', 'booked', 'in_transit', 'arrived']).optional(),
  bookingRef: z.string().nullish(),
});

export async function updatePool(id: string, patch: z.infer<typeof updatePoolInput>) {
  const data = updatePoolInput.parse(patch);

  const [row] = await db
    .update(poolsTable)
    .set({
      status: data.status ?? undefined,
      bookingRef: data.bookingRef ?? undefined,
      updatedAt: sql`now()`,
    })
    .where(eq(poolsTable.id, id))
    .returning();

  return row ?? null;
}
