import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createTimestampColumn } from '../utils.js';
import { Json } from 'drizzle-zod';

export const warehousePickupsTable = pgTable('warehouse_pickups', {
  id: uuid('id').primaryKey().defaultRandom(),
  courier: text('courier').notNull(),
  items: jsonb('itemsTable').$type<Json>().notNull(),
  status: text('status').notNull().default('scheduled'),
  scheduleAt: createTimestampColumn('schedule_at').notNull(),
  createdAt: createTimestampColumn('created_at'),
  updatedAt: createTimestampColumn('updated_at', true),
});
