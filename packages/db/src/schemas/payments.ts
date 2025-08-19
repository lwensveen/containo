import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createTimestampColumn } from '../utils.js';
import { poolItemsTable } from './pool-items.js';

export const paymentsTable = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .notNull()
      .references(() => poolItemsTable.id, { onDelete: 'cascade' }),
    stripeSessionId: text('stripe_session_id').notNull(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    status: varchar('status', { length: 32 }).notNull().default('created'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (table) => [
    uniqueIndex('ux_payments_stripe_session').on(table.stripeSessionId),
    uniqueIndex('ux_payments_stripe_pi').on(table.stripePaymentIntentId),
    index('idx_payments_item').on(table.itemId),
    index('idx_payments_status').on(table.status),
    sql`CONSTRAINT chk_payment_amount_positive CHECK (${table.amountCents} > 0)`,
    sql`CONSTRAINT chk_payment_currency_cc CHECK (char_length(${table.currency}) = 3 AND ${table.currency} = upper(${table.currency}))`,
    sql`CONSTRAINT chk_payment_status CHECK (${table.status} IN ('created','completed','paid','canceled','refunded','failed'))`,
  ]
);
