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
import { inboundStatusEnum, modeEnum } from '../enums.js';
import { usersTable } from './users/users.js';
import { poolsTable } from './pools.js';

export const inboundParcelsTable = pgTable(
  'inbound_parcels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    hubCode: text('hub_code').notNull(),
    originPort: varchar('origin_port', { length: 3 }).notNull(),
    destPort: varchar('dest_port', { length: 3 }).notNull(),
    mode: modeEnum('mode').notNull(),
    sellerName: text('seller_name'),
    extTracking: text('ext_tracking'),
    lengthCm: integer('length_cm'),
    widthCm: integer('width_cm'),
    heightCm: integer('height_cm'),
    weightKg: numeric('weight_kg', { precision: 10, scale: 3 }),
    status: inboundStatusEnum('status').notNull().default('expected'),
    receivedAt: timestamp('received_at', { withTimezone: true }),
    freeUntilAt: timestamp('free_until_at', { withTimezone: true }),
    photoUrl: text('photo_url'),
    notes: text('notes'),
    poolId: uuid('pool_id').references(() => poolsTable.id, { onDelete: 'set null' }),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => [
    index('idx_inbound_user_created').on(t.userId, t.createdAt),
    index('idx_inbound_status').on(t.status),
    index('idx_inbound_lane').on(t.originPort, t.destPort, t.mode),
    index('idx_inbound_pool').on(t.poolId),
    sql`CONSTRAINT chk_inbound_dims_positive CHECK (
      ( ${t.lengthCm} IS NULL OR ${t.lengthCm} > 0 ) AND
      ( ${t.widthCm}  IS NULL OR ${t.widthCm}  > 0 ) AND
      ( ${t.heightCm} IS NULL OR ${t.heightCm} > 0 ) AND
      ( ${t.weightKg} IS NULL OR ${t.weightKg} > 0 )
    )`,
  ]
);
