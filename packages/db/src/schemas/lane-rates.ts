import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { modeEnum } from '../enums.js';
import { createTimestampColumn } from '../utils.js';

export const laneRatesTable = pgTable(
  'lane_rates',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    originPort: varchar('origin_port', { length: 3 }).notNull(),
    destPort: varchar('dest_port', { length: 3 }).notNull(),
    mode: modeEnum('mode').notNull(),
    seaPricePerCbm: numeric('sea_price_per_cbm'),
    seaMinPrice: numeric('sea_min_price'),
    airPricePerKg: numeric('air_price_per_kg'),
    airMinPrice: numeric('air_min_price'),
    serviceFeePerOrder: numeric('service_fee_per_order').default('0'),
    effectiveFrom: createTimestampColumn('effective_from').defaultNow(),
    effectiveTo: createTimestampColumn('effective_to'),
    priority: integer('priority').default(0),
    active: boolean('active').notNull().default(true),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (table) => [
    index('idx_lane_rates_lane_active')
      .on(table.originPort, table.destPort, table.mode, table.priority)
      .where(sql`${table.active} = true`),
    index('idx_lane_rates_effective_from').on(table.effectiveFrom),
    uniqueIndex('ux_lane_mode_priority_from').on(
      table.originPort,
      table.destPort,
      table.mode,
      table.priority,
      table.effectiveFrom
    ),
    sql`CONSTRAINT chk_lane_rate_port_codes
        CHECK (char_length(${table.originPort}) = 3 AND ${table.originPort} = upper(${table.originPort})
           AND char_length(${table.destPort}) = 3 AND ${table.destPort} = upper(${table.destPort}))`,
    sql`CONSTRAINT chk_lane_rate_positive
        CHECK (coalesce(${table.seaPricePerCbm}, 0) >= 0
           AND coalesce(${table.seaMinPrice}, 0) >= 0
           AND coalesce(${table.airPricePerKg}, 0) >= 0
           AND coalesce(${table.airMinPrice}, 0) >= 0
           AND coalesce(${table.serviceFeePerOrder}, 0) >= 0)`,
    sql`CONSTRAINT chk_lane_rate_dates
        CHECK (${table.effectiveTo} IS NULL OR ${table.effectiveTo} > ${table.effectiveFrom})`,
    sql`CONSTRAINT chk_lane_rate_mode_prices
        CHECK (
          (${table.mode} = 'sea' AND ${table.seaPricePerCbm} IS NOT NULL AND ${table.seaMinPrice} IS NOT NULL
                           AND ${table.airPricePerKg} IS NULL AND ${table.airMinPrice} IS NULL)
          OR
          (${table.mode} = 'air' AND ${table.airPricePerKg} IS NOT NULL AND ${table.airMinPrice} IS NOT NULL
                           AND ${table.seaPricePerCbm} IS NULL AND ${table.seaMinPrice} IS NULL)
        )`,
  ]
);
