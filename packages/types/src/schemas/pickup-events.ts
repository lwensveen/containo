import { z } from 'zod/v4';
import { createSelectSchema } from 'drizzle-zod';
import { pickupEventsTable } from '@containo/db';

export const PickupEventTypeEnum = z.enum([
  'pickup_requested',
  'pickup_scheduled',
  'pickup_picked_up',
  'pickup_canceled',
]);

export const PickupEventSelectSchema = createSelectSchema(pickupEventsTable);
export const PickupEventRecordSchema = PickupEventSelectSchema;
export const PickupEventIdParamSchema = z.object({ id: z.string().uuid() });
