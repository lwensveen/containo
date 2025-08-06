import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createTimestampColumn } from '../utils.js';

export const webhookSubscriptionsTable = pgTable(
  'webhook_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull(),
    events: text('events').notNull().default('*'),
    secret: text('secret').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => ({
    activeIdx: index('idx_webhooks_active').on(t.isActive, t.createdAt),
  })
);
