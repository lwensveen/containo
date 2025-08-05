import { laneRates } from '../../db/schema';
import { gte, isNull } from 'drizzle-orm';

export function orNullableLte(now: Date, col: typeof laneRates.effectiveTo) {
  return isNull(col) || gte(col, now as any);
}
