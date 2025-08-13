import { integer, numeric, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createTimestampColumn } from '../utils.js';

export const intentsTable = pgTable('intents', {
  id: varchar('id', { length: 36 }).primaryKey(),
  idempotencyKey: varchar('idempotency_key', { length: 100 }).unique(),
  originPort: varchar('origin_port', { length: 3 }).notNull(),
  destPort: varchar('dest_port', { length: 3 }).notNull(),
  mode: varchar('mode', { length: 8 }).notNull(),
  cutoffAt: timestamp('cutoff_at', { withTimezone: true }).notNull(),
  weightKg: numeric('weight_kg', { precision: 10, scale: 3 }).notNull(),
  dimsL: integer('dims_l_cm').notNull(),
  dimsW: integer('dims_w_cm').notNull(),
  dimsH: integer('dims_h_cm').notNull(),
  createdAt: createTimestampColumn('created_at').notNull(),
});
