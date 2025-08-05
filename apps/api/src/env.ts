export const ENV = {
  PORT: Number(process.env.PORT ?? 4000),

  POOL_SEA_CAP_M3: Number(process.env.POOL_SEA_CAP_M3 ?? 1.2),
  POOL_AIR_CAP_M3: Number(process.env.POOL_AIR_CAP_M3 ?? 0.25),

  SEA_PRICE_PER_CBM: Number(process.env.SEA_PRICE_PER_CBM ?? 150),
  SEA_MIN_PRICE: Number(process.env.SEA_MIN_PRICE ?? 35),

  AIR_PRICE_PER_KG: Number(process.env.AIR_PRICE_PER_KG ?? 22),
  AIR_MIN_PRICE: Number(process.env.AIR_MIN_PRICE ?? 90),

  SERVICE_FEE_PER_ORDER: Number(process.env.SERVICE_FEE_PER_ORDER ?? 10),

  WEBHOOK_MAX_ATTEMPTS: Number(process.env.WEBHOOK_MAX_ATTEMPTS ?? 8),
};
