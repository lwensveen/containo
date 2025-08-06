import { index, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { itemStatusEnum, modeEnum } from '../enums.js';
import { createTimestampColumn } from '../utils.js';
import { sql } from 'drizzle-orm';
import { poolsTable } from './pools.js';

export const poolItemsTable = pgTable(
  'pool_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    poolId: uuid('pool_id').references(() => poolsTable.id),
    originPort: text('origin_port').notNull(),
    destPort: text('dest_port').notNull(),
    mode: modeEnum('mode').notNull(),
    cutoffISO: text('cutoff_iso').notNull(),
    weightKg: numeric('weight_kg').notNull(),
    volumeM3: numeric('volume_m3').notNull(),
    length: numeric('l_cm').notNull(),
    width: numeric('w_cm').notNull(),
    height: numeric('h_cm').notNull(),
    status: itemStatusEnum('status').notNull().default('pending'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => ({
    pendingLaneIdx: index('idx_items_pending_lane')
      .on(t.originPort, t.destPort, t.mode, t.cutoffISO)
      .where(sql`status = 'pending'`),
    byPoolIdx: index('idx_items_by_pool').on(t.poolId),
  })
);
