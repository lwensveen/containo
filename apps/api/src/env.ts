export const ENV = {
  PORT: Number(process.env.PORT ?? 4000),
  POOL_SEA_CAP_M3: Number(process.env.POOL_SEA_CAP_M3 ?? 1.2), // ~ 1.2m³ dev
  POOL_AIR_CAP_M3: Number(process.env.POOL_AIR_CAP_M3 ?? 0.25), // ~ 0.25m³ dev
};
