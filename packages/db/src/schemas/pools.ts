import { index, numeric, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { modeEnum, poolStatusEnum } from '../enums.js';
import { createTimestampColumn } from '../utils.js';
import { sql } from 'drizzle-orm';

export const poolsTable = pgTable(
  'pools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originPort: text('origin_port').notNull(),
    destPort: text('dest_port').notNull(),
    mode: modeEnum('mode').notNull(),
    cutoffISO: text('cutoff_iso').notNull(),
    capacityM3: numeric('capacity_m3').notNull(),
    usedM3: numeric('used_m3').notNull().default('0'),
    status: poolStatusEnum('status').notNull().default('open'),
    bookingRef: text('booking_ref'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (table) => ({
    openLaneIdx: index('idx_pools_open_lane')
      .on(table.originPort, table.destPort, table.mode, table.cutoffISO)
      .where(sql`status = 'open'`),
    usedLeCapacity: sql`CONSTRAINT chk_used_le_capacity CHECK (${table.usedM3} <= ${table.capacityM3})`,
  })
);

export const uxOpenPoolPerLaneMode = uniqueIndex('ux_open_pool_per_lane_mode')
  .on(poolsTable.originPort, poolsTable.destPort, poolsTable.mode)
  .where(sql`status = 'open'`);

export const ux_open_pool_per_lane_cutoff = uniqueIndex('ux_open_pool_per_lane_cutoff')
  .on(poolsTable.originPort, poolsTable.destPort, poolsTable.mode, poolsTable.cutoffISO)
  .where(sql`status = 'open'`);
