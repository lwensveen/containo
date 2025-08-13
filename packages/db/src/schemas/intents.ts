import { integer, numeric, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createTimestampColumn } from '../utils.js';

export const intentsTable = pgTable('intents', {
  id: varchar('id', { length: 36 }).primaryKey(),
  idempotencyKey: varchar('idempotency_key', { length: 100 }),
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

export const uxIntentsIdem = uniqueIndex('ux_intents_idempotency')
  .on(intentsTable.idempotencyKey)
  .where(sql`idempotency_key is not null`);
