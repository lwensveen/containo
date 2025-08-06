import { laneRatesTable } from '@containo/db';
import { gte, isNull } from 'drizzle-orm';

export function orNullableLte(now: Date, col: typeof laneRatesTable.effectiveTo) {
  return isNull(col) || gte(col, now as any);
}
