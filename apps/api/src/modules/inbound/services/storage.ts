import { and, eq, gt, isNotNull, sql } from 'drizzle-orm';
import { db, inboundEventsTable, inboundParcelsTable } from '@containo/db';

const RATE = Number(process.env.STORAGE_RATE_PER_CBM_PER_DAY ?? 1.0);
const CCY = (process.env.STORAGE_CCY ?? 'EUR').toUpperCase();

function floorDays(ms: number) {
  return Math.floor(ms / 86_400_000);
}

function volumeCbmFromDims(l?: number | null, w?: number | null, h?: number | null) {
  if (!l || !w || !h) return null;
  return (Number(l) * Number(w) * Number(h)) / 1_000_000;
}

export async function accrueStorageFeesNow() {
  const now = new Date();

  const rows = await db
    .select()
    .from(inboundParcelsTable)
    .where(
      and(
        eq(inboundParcelsTable.status, 'received'),
        isNotNull(inboundParcelsTable.freeUntilAt),
        gt(inboundParcelsTable.freeUntilAt, new Date(0))
      )
    );

  let accrued = 0;

  for (const r of rows) {
    if (!r.freeUntilAt) continue;
    if (r.freeUntilAt > now) continue;

    const vol = volumeCbmFromDims(r.lengthCm, r.widthCm, r.heightCm);
    if (vol == null || vol <= 0) continue;

    const [last] = await db
      .select()
      .from(inboundEventsTable)
      .where(
        and(eq(inboundEventsTable.inboundId, r.id), eq(inboundEventsTable.type, 'storage_accrued'))
      )
      .orderBy(sql`created_at desc`)
      .limit(1);

    const start =
      last?.createdAt && last.createdAt > r.freeUntilAt ? last.createdAt : r.freeUntilAt;
    const deltaDays = floorDays(now.getTime() - start.getTime());
    if (deltaDays <= 0) continue;

    const amount = RATE * vol * deltaDays;

    await db.insert(inboundEventsTable).values({
      inboundId: r.id,
      type: 'storage_accrued',
      payload: {
        days: deltaDays,
        from: start.toISOString(),
        to: now.toISOString(),
        volumeCbm: Number(vol.toFixed(4)),
        ratePerCbmPerDay: RATE,
        currency: CCY,
        amount: Number(amount.toFixed(2)),
      },
    });

    accrued++;
  }

  return { candidates: rows.length, accrued };
}
