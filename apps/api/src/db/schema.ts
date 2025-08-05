import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createTimestampColumn } from './utils';
import {
  deliveryStatusEnum,
  itemStatusEnum,
  modeEnum,
  poolEventEnum,
  poolStatusEnum,
} from './enums';

export const pools = pgTable(
  'pools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originPort: text('origin_port').notNull(),
    destPort: text('dest_port').notNull(),
    mode: modeEnum('mode').notNull(),
    cutoffISO: text('cutoff_iso').notNull(),
    capacityM3: numeric('capacity_m3').notNull(),
    usedM3: numeric('used_m3').notNull().default('0'),
    status: poolStatusEnum('status').notNull().default('open'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (table) => ({
    openLaneIdx: index('idx_pools_open_lane')
      .on(table.originPort, table.destPort, table.mode, table.cutoffISO)
      .where(sql`status = 'open'`),
    usedLeCapacity: sql`CONSTRAINT chk_used_le_capacity CHECK (${table.usedM3} <= ${table.capacityM3})`,
  })
);

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    poolId: uuid('pool_id').references(() => pools.id),
    originPort: text('origin_port').notNull(),
    destPort: text('dest_port').notNull(),
    mode: modeEnum('mode').notNull(),
    cutoffISO: text('cutoff_iso').notNull(),
    weightKg: numeric('weight_kg').notNull(),
    volumeM3: numeric('volume_m3').notNull(),
    length: numeric('l_cm').notNull(),
    width: numeric('w_cm').notNull(),
    height: numeric('h_cm').notNull(),
    status: itemStatusEnum('status').notNull().default('pending'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => ({
    pendingLaneIdx: index('idx_items_pending_lane')
      .on(t.originPort, t.destPort, t.mode, t.cutoffISO)
      .where(sql`status = 'pending'`),
    byPoolIdx: index('idx_items_by_pool').on(t.poolId),
  })
);

export const poolEvents = pgTable(
  'pool_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    poolId: uuid('pool_id')
      .notNull()
      .references(() => pools.id),
    type: poolEventEnum('type').notNull(),
    payload: jsonb('payload')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: createTimestampColumn('created_at'),
  },
  (table) => ({
    poolTimeIdx: index('idx_pool_events_pool_created').on(table.poolId, table.createdAt),
  })
);

export const laneRates = pgTable(
  'lane_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originPort: text('origin_port').notNull(),
    destPort: text('dest_port').notNull(),
    mode: modeEnum('mode').notNull(),
    seaPricePerCbm: numeric('sea_price_per_cbm'),
    seaMinPrice: numeric('sea_min_price'),
    airPricePerKg: numeric('air_price_per_kg'),
    airMinPrice: numeric('air_min_price'),
    serviceFeePerOrder: numeric('service_fee_per_order'),
    effectiveFrom: timestamp('effective_from', { withTimezone: false }).defaultNow(),
    effectiveTo: timestamp('effective_to', { withTimezone: false }),
    priority: integer('priority').default(0),
    active: boolean('active').notNull().default(true),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => ({
    laneIdx: index('idx_lane_rates_lane_active').on(t.originPort, t.destPort, t.mode, t.priority),
  })
);

export const webhookSubscriptions = pgTable(
  'webhook_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull(),
    events: text('events').notNull().default('*'),
    secret: text('secret').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => ({
    activeIdx: index('idx_webhooks_active').on(t.isActive, t.createdAt),
  })
);

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => webhookSubscriptions.id),
    eventId: uuid('event_id').notNull(),
    eventType: poolEventEnum('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: false }).notNull().defaultNow(),
    lastError: text('last_error'),
    responseStatus: integer('response_status'),
    status: deliveryStatusEnum('status').notNull().default('pending'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => ({
    pendingIdx: index('idx_webhook_deliveries_pending').on(
      t.status,
      t.nextAttemptAt,
      t.attemptCount
    ),
  })
);
