import { index, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';
import { poolEventEnum } from '../enums.js';
import { sql } from 'drizzle-orm';
import { createTimestampColumn } from '../utils.js';
import { poolsTable } from './pools.js';

export const poolEventsTable = pgTable(
  'pool_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    poolId: uuid('pool_id')
      .notNull()
      .references(() => poolsTable.id),
    type: poolEventEnum('type').notNull(),
    payload: jsonb('payload')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: createTimestampColumn('created_at'),
  },
  (table) => ({
    poolTimeIdx: index('idx_pool_events_pool_created').on(table.poolId, table.createdAt),
  })
);
