import { integer, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { createTimestampColumn } from '../utils.js';

export const paymentsTable = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  // tie payment to a pool item (buyer shipment) — adjust to intentId if you prefer
  itemId: uuid('item_id').notNull(),
  stripeSessionId: text('stripe_session_id').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  status: varchar('status', { length: 32 }).notNull().default('created'), // created|completed|canceled|failed
  createdAt: createTimestampColumn('created_at'),
  updatedAt: createTimestampColumn('updated_at', true),
});
