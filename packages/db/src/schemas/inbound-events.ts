import { index, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';
import { createTimestampColumn } from '../utils.js';
import { inboundEventTypeEnum } from '../enums.js';
import { inboundParcelsTable } from './inbound-parcels.js';

export const inboundEventsTable = pgTable(
  'inbound_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inboundId: uuid('inbound_id')
      .notNull()
      .references(() => inboundParcelsTable.id, { onDelete: 'cascade' }),
    type: inboundEventTypeEnum('type').notNull(),
    payload: jsonb('payload')
      .$type<Record<string, unknown>>()
      .notNull()
      .default('{}' as any),
    createdAt: createTimestampColumn('created_at'),
  },
  (t) => [index('idx_inbound_events_inbound_created').on(t.inboundId, t.createdAt)]
);
