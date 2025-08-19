import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { modeEnum, poolStatusEnum } from '../enums.js';
import { createTimestampColumn } from '../utils.js';

export const poolsTable = pgTable(
  'pools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originPort: varchar('origin_port', { length: 3 }).notNull(),
    destPort: varchar('dest_port', { length: 3 }).notNull(),
    mode: modeEnum('mode').notNull(),
    cutoffAt: timestamp('cutoff_at', { withTimezone: true }).notNull(),
    capacityM3: numeric('capacity_m3').notNull(),
    usedM3: numeric('used_m3').notNull().default('0'),
    status: poolStatusEnum('status').notNull().default('open'),
    bookingRef: text('booking_ref'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (table) => [
    index('idx_pools_open_lane')
      .on(table.originPort, table.destPort, table.mode, table.cutoffAt)
      .where(sql`status = 'open'`),
    index('idx_pools_status_cutoff').on(table.status, table.cutoffAt),
    uniqueIndex('ux_pools_booking_ref').on(table.bookingRef),
    sql`CONSTRAINT chk_used_le_capacity CHECK (${table.usedM3} <= ${table.capacityM3})`,
  ]
);

// export const ux_open_pool_per_lane_cutoff = uniqueIndex('ux_open_pool_per_lane_cutoff')
//   .on(poolsTable.originPort, poolsTable.destPort, poolsTable.mode, poolsTable.cutoffAt)
//   .where(sql`status = 'open'`);
