import {
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createTimestampColumn } from '../utils.js';
import { modeEnum } from '../enums.js';
import { usersTable } from './users/users.js';

export const intentsTable = pgTable(
  'intents',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    idempotencyKey: varchar('idempotency_key', { length: 100 }),
    originPort: varchar('origin_port', { length: 3 }).notNull(),
    destPort: varchar('dest_port', { length: 3 }).notNull(),
    mode: modeEnum('mode').notNull(),
    cutoffAt: timestamp('cutoff_at', { withTimezone: true }).notNull(),
    weightKg: numeric('weight_kg', { precision: 10, scale: 3 }).notNull(),
    dimsL: integer('dims_l_cm').notNull(),
    dimsW: integer('dims_w_cm').notNull(),
    dimsH: integer('dims_h_cm').notNull(),
    createdAt: createTimestampColumn('created_at').notNull(),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (table) => [
    uniqueIndex('ux_intents_user_idem').on(table.userId, table.idempotencyKey),
    index('idx_intents_idem').on(table.idempotencyKey),
    index('idx_intents_lane_cutoff').on(
      table.originPort,
      table.destPort,
      table.mode,
      table.cutoffAt
    ),
    sql`CONSTRAINT chk_intents_weights_dims
        CHECK (${table.weightKg} > 0 AND ${table.dimsL} > 0 AND ${table.dimsW} > 0 AND ${table.dimsH} > 0)`,
    sql`CONSTRAINT chk_intents_port_codes
        CHECK (char_length(${table.originPort}) = 3 AND ${table.originPort} = upper(${table.originPort})
           AND char_length(${table.destPort}) = 3 AND ${table.destPort} = upper(${table.destPort}))`,
  ]
);
