import { and, desc, eq, sql } from 'drizzle-orm';
import { db, laneRatesTable } from '@containo/db';

export type LaneKey = {
  originPort: string;
  destPort: string;
  mode: 'air' | 'sea';
};

export type InboundDims = {
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
};

export type PriceBreakdown = {
  base: number;
  minApplied: boolean;
  serviceFee: number;
  chargeableKg?: number;
  volumeM3?: number;
  rateId?: string;
};

export async function getActiveLaneRate(key: LaneKey, at: Date = new Date()) {
  const nowIso = at.toISOString();

  const rows = await db
    .select()
    .from(laneRatesTable)
    .where(
      and(
        eq(laneRatesTable.originPort, key.originPort.toUpperCase()),
        eq(laneRatesTable.destPort, key.destPort.toUpperCase()),
        eq(laneRatesTable.mode, key.mode),
        eq(laneRatesTable.active, true),
        sql`${laneRatesTable.effectiveFrom} <= ${nowIso}::timestamptz`,
        sql`(${laneRatesTable.effectiveTo} IS NULL OR ${laneRatesTable.effectiveTo} >= ${nowIso}::timestamptz)`
      )
    )
    .orderBy(desc(laneRatesTable.priority), desc(laneRatesTable.effectiveFrom))
    .limit(1);

  return rows[0] ?? null;
}

export function computePriceForInbound(
  key: LaneKey,
  dims: InboundDims,
  rate: Awaited<ReturnType<typeof getActiveLaneRate>>,
  opts?: { airDivisor?: number }
): { amountUsd: number; breakdown: PriceBreakdown } {
  if (!rate) throw new Error('No active lane rate found');

  const serviceFee = Number(rate.serviceFeePerOrder ?? 0) || 0;

  const l = dims.lengthCm ?? 0;
  const w = dims.widthCm ?? 0;
  const h = dims.heightCm ?? 0;
  const weightKg = Number(dims.weightKg ?? 0) || 0;

  if (key.mode === 'air') {
    const divisor = opts?.airDivisor ?? Number(process.env.AIR_DIVISOR ?? 6000);
    const chargeableKg = Math.max(weightKg, (l * w * h) / divisor);
    const perKg = Number(rate.airPricePerKg ?? 0) || 0;
    const min = Number(rate.airMinPrice ?? 0) || 0;

    const base = perKg * chargeableKg;
    const minApplied = base < min;
    const amount = (minApplied ? min : base) + serviceFee;

    return {
      amountUsd: clampMoney(amount),
      breakdown: {
        base: round2(base),
        minApplied,
        serviceFee: round2(serviceFee),
        chargeableKg: round2(chargeableKg),
        rateId: (rate as any).id,
      },
    };
  }

  const volumeM3 = (l * w * h) / 1_000_000;
  const perCbm = Number(rate.seaPricePerCbm ?? 0) || 0;
  const min = Number(rate.seaMinPrice ?? 0) || 0;

  const base = perCbm * volumeM3;
  const minApplied = base < min;
  const amount = (minApplied ? min : base) + serviceFee;

  return {
    amountUsd: clampMoney(amount),
    breakdown: {
      base: round2(base),
      minApplied,
      serviceFee: round2(serviceFee),
      volumeM3: round2(volumeM3),
      rateId: (rate as any).id,
    },
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function clampMoney(n: number) {
  return Math.max(0, round2(n));
}
