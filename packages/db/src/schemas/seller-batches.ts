import { index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createTimestampColumn } from '../utils.js';

export const sellerBatchesTable = pgTable(
  'seller_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id').notNull(),
    items: jsonb('items')
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: text('status').notNull().default('pending'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => [
    index('idx_seller_batches_seller_created').on(t.sellerId, t.createdAt),
    index('idx_seller_batches_status').on(t.status),
    sql`CONSTRAINT chk_seller_batches_items_json
        CHECK (jsonb_typeof(${t.items}) IN ('array','object'))`,
  ]
);
