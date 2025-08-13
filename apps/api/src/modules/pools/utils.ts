import { getEffectiveRates } from '../pricing/services.js';
import { createHash } from 'node:crypto';
import { Input } from './services/submit-intent.js';

export function expectOne<T>(rows: T[], msg: string): T {
  const row = rows[0];
  if (!row) throw new Error(msg);
  return row;
}

export function toNumber(s: string | number) {
  return typeof s === 'number' ? s : Number(s);
}

const AIR_VOLUMETRIC_FACTOR = 167;

export type QuoteInput = {
  mode: 'sea' | 'air';
  weightKg: number;
  dimsCm: { length: number; width: number; height: number };
  originPort?: string;
  destPort?: string;
};

export type Quote = {
  userPrice: number;
  costBasis: number;
  serviceFee: number;
  margin: number;
  volumeM3: number;
  billableKg: number;
  breakdown: Record<string, number>;
};

export function cmToM3({ length, width, height }: QuoteInput['dimsCm']) {
  return (length * width * height) / 1_000_000;
}

export async function quotePrice(input: QuoteInput): Promise<Quote> {
  const { mode, weightKg, dimsCm, originPort, destPort } = input;
  const volumeM3 = cmToM3(dimsCm);

  const eff = await getEffectiveRates({ originPort, destPort, mode });

  if (mode === 'air') {
    const volumetricKg = volumeM3 * AIR_VOLUMETRIC_FACTOR;
    const billableKg = Math.max(weightKg, volumetricKg);
    const base = billableKg * eff.airPricePerKg;
    const costBasis = Math.max(base, eff.airMinPrice);
    const serviceFee = eff.serviceFeePerOrder;
    const userPrice = Math.round(costBasis + serviceFee);
    const margin = userPrice - costBasis;

    return {
      userPrice,
      costBasis,
      serviceFee,
      margin,
      volumeM3,
      billableKg,
      breakdown: {
        billableKg,
        perKg: eff.airPricePerKg,
        min: eff.airMinPrice,
        serviceFee,
      },
    };
  }

  const base = volumeM3 * eff.seaPricePerCbm;
  const costBasis = Math.max(base, eff.seaMinPrice);
  const serviceFee = eff.serviceFeePerOrder;
  const userPrice = Math.round(costBasis + serviceFee);
  const margin = userPrice - costBasis;

  return {
    userPrice,
    costBasis,
    serviceFee,
    margin,
    volumeM3,
    billableKg: weightKg,
    breakdown: {
      volumeM3,
      perCbm: eff.seaPricePerCbm,
      min: eff.seaMinPrice,
      serviceFee,
    },
  };
}

export function fingerprint(i: Input) {
  const h = createHash('sha256');
  h.update(
    JSON.stringify({
      userId: i.userId,
      originPort: i.originPort,
      destPort: i.destPort,
      mode: i.mode,
      cutoffISO: i.cutoffISO,
      weightKg: i.weightKg,
      dimsCm: i.dimsCm,
    })
  );

  return h.digest('hex');
}
