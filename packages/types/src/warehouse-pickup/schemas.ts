import { z } from 'zod/v4';

export const pickupItemSchema = z.object({
  orderId: z.uuid(),
  address: z.string(),
  weightKg: z.number().positive(),
  dimsCm: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
});

export const createPickupSchema = z.object({
  courier: z.string(),
  scheduleISO: z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid ISO date' }),
  items: z.array(pickupItemSchema).min(1),
});

export const pickupResponseSchema = z.object({
  id: z.uuid(),
  courier: z.string(),
  scheduleAt: z.string(),
  items: z.array(pickupItemSchema),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
