import { integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createTimestampColumn } from '../utils.js';
import { pickupStatusEnum } from '../enums.js';

export const pickupsTable = pgTable('pickups', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  contactName: text('contact_name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  address1: text('address1').notNull(),
  address2: text('address2'),
  city: text('city').notNull(),
  state: text('state'),
  postcode: text('postcode').notNull(),
  country: text('country').notNull(),
  windowStartISO: text('window_start_iso').notNull(),
  windowEndISO: text('window_end_iso').notNull(),
  pieces: integer('pieces').notNull().default(1),
  totalWeightKg: numeric('total_weight_kg').notNull(),
  notes: text('notes'),
  status: pickupStatusEnum('status').notNull().default('requested'),
  carrierRef: text('carrier_ref'),
  labelUrl: text('label_url'),
  createdAt: createTimestampColumn('created_at'),
  updatedAt: createTimestampColumn('updated_at', true),
});
