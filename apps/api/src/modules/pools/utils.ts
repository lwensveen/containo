import { ENV } from "../../env";

export function expectOne<T>(rows: T[], msg: string): T {
  const row = rows[0];
  if (!row) throw new Error(msg);
  return row;
}

const AIR_VOLUMETRIC_FACTOR = 167;

export type QuoteInput = {
  mode: "sea" | "air";
  weightKg: number;
  dimsCm: { length: number; width: number; height: number };
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

export function cmToM3({ length, width, height }: QuoteInput["dimsCm"]) {
  return (length * width * height) / 1_000_000;
}

export function quotePrice(input: QuoteInput): Quote {
  const { mode, weightKg, dimsCm } = input;
  const volumeM3 = cmToM3(dimsCm);

  if (mode === "air") {
    const volumetricKg = volumeM3 * AIR_VOLUMETRIC_FACTOR;
    const billableKg = Math.max(weightKg, volumetricKg);
    const base = billableKg * ENV.AIR_PRICE_PER_KG;
    const costBasis = Math.max(base, ENV.AIR_MIN_PRICE);
    const serviceFee = ENV.SERVICE_FEE_PER_ORDER;
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
        perKg: ENV.AIR_PRICE_PER_KG,
        min: ENV.AIR_MIN_PRICE,
        serviceFee,
      },
    };
  }

  const perCbm = ENV.SEA_PRICE_PER_CBM;
  const base = volumeM3 * perCbm;
  const costBasis = Math.max(base, ENV.SEA_MIN_PRICE);
  const serviceFee = ENV.SERVICE_FEE_PER_ORDER;
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
      perCbm,
      min: ENV.SEA_MIN_PRICE,
      serviceFee,
    },
  };
}
