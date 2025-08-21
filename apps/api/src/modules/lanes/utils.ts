export function m3FromDims(l: number, w: number, h: number, pieces = 1) {
  // cm → m, then volume
  return (l / 100) * (w / 100) * (h / 100) * pieces;
}

export function chargeableKgFromDims(
  l: number,
  w: number,
  h: number,
  pieces = 1,
  divisor = Number(process.env.AIR_DIVISOR!)
) {
  // IATA standard divisor (cm^3 / kg), commonly 6000; some carriers use 5000.
  // volumetric kg = (L*W*H)/divisor, with cm inputs.
  return ((l * w * h) / divisor) * pieces;
}
