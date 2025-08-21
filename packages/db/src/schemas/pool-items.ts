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
import { itemStatusEnum, modeEnum } from '../enums.js';
import { createTimestampColumn } from '../utils.js';
import { poolsTable } from './pools.js';
import { usersTable } from './users/users.js';

export const poolItemsTable = pgTable(
  'pool_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    poolId: uuid('pool_id').references(() => poolsTable.id, { onDelete: 'set null' }),
    originPort: varchar('origin_port', { length: 3 }).notNull(),
    destPort: varchar('dest_port', { length: 3 }).notNull(),
    mode: modeEnum('mode').notNull(),
    stripeSessionId: text('stripe_session_id'),
    cutoffAt: timestamp('cutoff_at', { withTimezone: true }).notNull(),
    weightKg: numeric('weight_kg').notNull(),
    volumeM3: numeric('volume_m3').notNull(),
    length: numeric('l_cm').notNull(),
    width: numeric('w_cm').notNull(),
    height: numeric('h_cm').notNull(),
    status: itemStatusEnum('status').notNull().default('pending'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (table) => [
    index('idx_items_pending_lane')
      .on(table.originPort, table.destPort, table.mode, table.cutoffAt)
      .where(sql`status = 'pending'`),
    index('idx_items_by_pool').on(table.poolId),
    index('idx_items_user_created').on(table.userId, table.createdAt),
    uniqueIndex('ux_pool_items_stripe_session').on(table.stripeSessionId),
  ]
);
