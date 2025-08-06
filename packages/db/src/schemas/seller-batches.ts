import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createTimestampColumn } from '../utils.js';

export const sellerBatchesTable = pgTable('seller_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id').notNull(),
  // .references(() => sellers.id), for future sellers
  items: jsonb('itemsTable').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: createTimestampColumn('created_at'),
  updatedAt: createTimestampColumn('updated_at', true),
});
