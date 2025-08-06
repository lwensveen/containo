import { boolean, index, integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { modeEnum } from '../enums.js';
import { createTimestampColumn } from '../utils.js';

export const laneRatesTable = pgTable(
  'lane_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originPort: text('origin_port').notNull(),
    destPort: text('dest_port').notNull(),
    mode: modeEnum('mode').notNull(),
    seaPricePerCbm: numeric('sea_price_per_cbm'),
    seaMinPrice: numeric('sea_min_price'),
    airPricePerKg: numeric('air_price_per_kg'),
    airMinPrice: numeric('air_min_price'),
    serviceFeePerOrder: numeric('service_fee_per_order'),
    effectiveFrom: createTimestampColumn('effective_from').defaultNow(),
    effectiveTo: createTimestampColumn('effective_to'),
    priority: integer('priority').default(0),
    active: boolean('active').notNull().default(true),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => ({
    laneIdx: index('idx_lane_rates_lane_active').on(t.originPort, t.destPort, t.mode, t.priority),
  })
);
