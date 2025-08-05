import { and, desc, eq, lte } from 'drizzle-orm';
import { db } from '../../db/client';
import { laneRates } from '../../db/schema';
import { ENV } from '../../env';
import { orNullableLte } from './utils';

type Mode = 'sea' | 'air';

export type EffectiveRates = {
  mode: Mode;
  seaPricePerCbm: number;
  seaMinPrice: number;
  airPricePerKg: number;
  airMinPrice: number;
  serviceFeePerOrder: number;
};

export async function getEffectiveRates(input: {
  originPort?: string;
  destPort?: string;
  mode: Mode;
  now?: Date;
}): Promise<EffectiveRates> {
  const now = input.now ?? new Date();

  let effectiveRate: EffectiveRates = {
    mode: input.mode,
    seaPricePerCbm: ENV.SEA_PRICE_PER_CBM,
    seaMinPrice: ENV.SEA_MIN_PRICE,
    airPricePerKg: ENV.AIR_PRICE_PER_KG,
    airMinPrice: ENV.AIR_MIN_PRICE,
    serviceFeePerOrder: ENV.SERVICE_FEE_PER_ORDER,
  };

  if (!input.originPort || !input.destPort) return effectiveRate;

  const rows = await db
    .select()
    .from(laneRates)
    .where(
      and(
        eq(laneRates.originPort, input.originPort),
        eq(laneRates.destPort, input.destPort),
        eq(laneRates.mode, input.mode),
        eq(laneRates.active, true),
        and(lte(laneRates.effectiveFrom, now as any), orNullableLte(now, laneRates.effectiveTo))
      )
    )
    .orderBy(desc(laneRates.priority), desc(laneRates.effectiveFrom))
    .limit(1);

  const lr = rows[0];
  if (!lr) return effectiveRate;

  effectiveRate = {
    mode: input.mode,
    seaPricePerCbm: Number(lr.seaPricePerCbm ?? effectiveRate.seaPricePerCbm),
    seaMinPrice: Number(lr.seaMinPrice ?? effectiveRate.seaMinPrice),
    airPricePerKg: Number(lr.airPricePerKg ?? effectiveRate.airPricePerKg),
    airMinPrice: Number(lr.airMinPrice ?? effectiveRate.airMinPrice),
    serviceFeePerOrder: Number(lr.serviceFeePerOrder ?? effectiveRate.serviceFeePerOrder),
  };

  return effectiveRate;
}
