import { index, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';
import { pickupEventTypeEnum } from '../enums.js';
import { pickupsTable } from './pickups.js';
import { createTimestampColumn } from '../utils.js';

export const pickupEventsTable = pgTable(
  'pickup_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pickupId: uuid('pickup_id')
      .notNull()
      .references(() => pickupsTable.id, { onDelete: 'cascade' }),
    type: pickupEventTypeEnum('type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown> | null>().default(null),
    createdAt: createTimestampColumn('created_at'),
  },
  (t) => ({
    byPickup: index('idx_pickup_events_pickup_created').on(t.pickupId, t.createdAt),
  })
);
