import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createTimestampColumn } from '../utils.js';
import { pickupStatusEnum } from '../enums.js';
import { usersTable } from './users/users.js';

export const pickupsTable = pgTable(
  'pickups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    contactName: text('contact_name').notNull(),
    company: text('company'),
    email: text('email'),
    phone: text('phone'),
    address1: text('address1').notNull(),
    address2: text('address2'),
    city: text('city').notNull(),
    state: text('state'),
    postcode: text('postcode').notNull(),
    country: varchar('country', { length: 2 }).notNull(),
    windowStartAt: timestamp('window_start_at', { withTimezone: true }).notNull(),
    windowEndAt: timestamp('window_end_at', { withTimezone: true }).notNull(),
    pieces: integer('pieces').notNull().default(1),
    totalWeightKg: numeric('total_weight_kg').notNull(),
    notes: text('notes'),
    status: pickupStatusEnum('status').notNull().default('requested'),
    carrierRef: text('carrier_ref'),
    labelUrl: text('label_url'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (table) => [
    index('idx_pickups_user_created').on(table.userId, table.createdAt),
    index('idx_pickups_status').on(table.status),
    sql`CONSTRAINT chk_pickups_positive CHECK (${table.pieces} > 0 AND ${table.totalWeightKg} > 0)`,
    sql`CONSTRAINT chk_country_cc CHECK (char_length(${table.country}) = 2 AND ${table.country} = upper(${table.country}))`,
    sql`CONSTRAINT chk_window_bounds CHECK (${table.windowEndAt} > ${table.windowStartAt})`,
  ]
);
