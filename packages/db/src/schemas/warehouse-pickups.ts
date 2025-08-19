import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createTimestampColumn } from '../utils.js';
import type { Json } from 'drizzle-zod';

export const warehousePickupsTable = pgTable(
  'warehouse_pickups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courier: text('courier').notNull(),
    items: jsonb('items')
      .$type<Json>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: text('status').notNull().default('scheduled'),
    scheduleAt: timestamp('schedule_at', { withTimezone: true }).notNull(),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => [
    index('idx_wh_pickups_status_schedule').on(t.status, t.scheduleAt),
    index('idx_wh_pickups_courier_schedule').on(t.courier, t.scheduleAt),
    sql`CONSTRAINT chk_wh_pickups_items_json
        CHECK (jsonb_typeof(${t.items}) IN ('array','object'))`,
    sql`CONSTRAINT chk_wh_pickups_courier_nonempty
        CHECK (char_length(${t.courier}) > 0)`,
  ]
);
