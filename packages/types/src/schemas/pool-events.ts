import { z } from 'zod/v4';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { poolEventsTable } from '@containo/db';

export const PoolEventSelectSchema = createSelectSchema(poolEventsTable);
export const PoolEventInsertSchema = createInsertSchema(poolEventsTable);
export const PoolEventUpdateSchema = createUpdateSchema(poolEventsTable);

export const EventTypeEnum = z.enum([
  'pool_created',
  'item_pooled',
  'fill_80',
  'fill_90',
  'fill_100',
  'status_changed',
]);

export const EventRecordSchema = z.object({
  id: z.uuid(),
  poolId: z.uuid(),
  type: EventTypeEnum,
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
});

export const EventRecentQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export const EventRecentResponseSchema = z.array(EventRecordSchema);
