import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { deliveryStatusEnum, webhookEventTypeEnum } from '../enums.js';
import { createTimestampColumn } from '../utils.js';
import { webhookSubscriptionsTable } from './webhook-subscriptions.js';

export const webhookDeliveriesTable = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => webhookSubscriptionsTable.id),
    eventId: uuid('event_id').notNull(),
    eventType: webhookEventTypeEnum('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: false }).defaultNow(),
    lastError: text('last_error'),
    responseStatus: integer('response_status'),
    status: deliveryStatusEnum('status').notNull().default('pending'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => ({
    pendingIdx: index('idx_webhook_deliveries_pending').on(
      t.status,
      t.nextAttemptAt,
      t.attemptCount
    ),
  })
);
