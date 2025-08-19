import { index, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { poolEventEnum } from '../enums.js';
import { createTimestampColumn } from '../utils.js';
import { poolsTable } from './pools.js';

export const poolEventsTable = pgTable(
  'pool_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    poolId: uuid('pool_id')
      .notNull()
      .references(() => poolsTable.id, { onDelete: 'cascade' }),
    type: poolEventEnum('type').notNull(),
    payload: jsonb('payload')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: createTimestampColumn('created_at'),
  },
  (table) => [
    index('idx_pool_events_pool_created').on(table.poolId, table.createdAt),
    index('idx_pool_events_type_created').on(table.type, table.createdAt),
  ]
);
