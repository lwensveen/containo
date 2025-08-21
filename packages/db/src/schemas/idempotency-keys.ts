import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { createTimestampColumn } from '../utils.js';

export const idempotencyKeysTable = pgTable(
  'idempotency_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scope: text('scope').notNull(),
    key: text('key').notNull(),
    requestHash: text('request_hash').notNull(),
    status: text('status').notNull().default('pending'),
    response: jsonb('response').$type<Record<string, unknown> | null>().default(null),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => [
    uniqueIndex('ux_idem_scope_key').on(t.scope, t.key),
    index('idx_idem_status_created').on(t.status, t.createdAt),
  ]
);
