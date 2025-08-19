import { z } from 'zod/v4';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { pickupsTable } from '@containo/db';

export const PickupSelectSchema = createSelectSchema(pickupsTable);
export const PickupInsertSchema = createInsertSchema(pickupsTable);
export const PickupUpdateSchema = createUpdateSchema(pickupsTable);

export const PickupCreateSchema = z.object({
  userId: z.string().uuid(),
  contactName: z.string().min(1),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(5).optional().nullable(),
  address1: z.string().min(1),
  address2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().optional().nullable(),
  postcode: z.string().min(1),
  country: z.string().length(2),
  windowStartAt: z.date(),
  windowEndAt: z.date(),
  pieces: z.coerce.number().int().positive().default(1),
  totalWeightKg: z.coerce.number().positive(),
  notes: z.string().optional().nullable(),
});

export const PickupStatusUpdateSchema = z.object({
  status: z.enum(['requested', 'scheduled', 'picked_up', 'canceled']),
  carrierRef: z.string().optional(),
  labelUrl: z.string().url().optional(),
});

export const PickupIdParamSchema = z.object({ id: z.string().uuid() });

export const PickupListQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  status: z.enum(['requested', 'scheduled', 'picked_up', 'canceled']).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const PickupRecordSchema = PickupSelectSchema;
export const PickupListResponseSchema = z.array(
  PickupSelectSchema.pick({
    id: true,
    userId: true,
    contactName: true,
    address1: true,
    city: true,
    postcode: true,
    country: true,
    windowStartAt: true,
    windowEndAt: true,
    pieces: true,
    totalWeightKg: true,
    status: true,
    carrierRef: true,
    labelUrl: true,
    createdAt: true,
  })
);
