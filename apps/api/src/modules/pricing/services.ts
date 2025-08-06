import { and, desc, eq, lte } from 'drizzle-orm';
import { db, laneRatesTable } from '@containo/db';
import { ENV } from '../../env.js';
import { orNullableLte } from './utils.js';

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
    .from(laneRatesTable)
    .where(
      and(
        eq(laneRatesTable.originPort, input.originPort),
        eq(laneRatesTable.destPort, input.destPort),
        eq(laneRatesTable.mode, input.mode),
        eq(laneRatesTable.active, true),
        and(
          lte(laneRatesTable.effectiveFrom, now as any),
          orNullableLte(now, laneRatesTable.effectiveTo)
        )
      )
    )
    .orderBy(desc(laneRatesTable.priority), desc(laneRatesTable.effectiveFrom))
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
