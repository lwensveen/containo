import { z } from 'zod/v4';

export const BuyerShipmentSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(['pending', 'pooled', 'pay_pending', 'paid', 'shipped', 'delivered']),
  weightKg: z.number(),
  volumeM3: z.number(),
  length: z.number(),
  width: z.number(),
  height: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  originPort: z.string().nullable(),
  destPort: z.string().nullable(),
  mode: z.enum(['sea', 'air']).nullable(),
  cutoffISO: z.string().nullable(),
  poolId: z.string().uuid().nullable(),
  poolStatus: z.enum(['open', 'closing', 'booked', 'in_transit', 'arrived']).nullable(),
  usedM3: z.string().nullable(),
  capacityM3: z.string().nullable(),
  bookingRef: z.string().nullable().optional(),
});

export const BuyerIdParamSchema = z.object({ userId: z.string().uuid() });

export const BuyerShipmentsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export const BuyerShipmentsResponseSchema = z.array(BuyerShipmentSchema);
