import { z } from 'zod';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { poolsTable } from '@containo/db';

export const PoolSelectSchema = createSelectSchema(poolsTable);
export const PoolInsertSchema = createInsertSchema(poolsTable);
export const PoolUpdateSchema = createUpdateSchema(poolsTable);

export const DimsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const QuoteInputSchema = z.object({
  mode: z.enum(['sea', 'air']),
  weightKg: z.number().positive(),
  dimsCm: DimsSchema,
  originPort: z.string().min(1).optional(),
  destPort: z.string().min(1).optional(),
});

export const QuoteSchema = z.object({
  userPrice: z.number(),
  costBasis: z.number(),
  serviceFee: z.number(),
  margin: z.number(),
  volumeM3: z.number(),
  billableKg: z.number(),
  breakdown: z.record(z.string(), z.number()),
});

export const QuoteResponseSchema = QuoteSchema;

export const IntentInputSchema = QuoteInputSchema.extend({
  userId: z.string().min(1),
  originPort: z.string().min(1),
  destPort: z.string().min(1),
  cutoffISO: z.string().min(1),
});

export const IntentResponseSchema = z.object({
  id: z.uuid(),
  accepted: z.literal(true),
  volumeM3: z.number(),
});

export const PoolIdParamSchema = z.object({
  id: z.uuid(),
});

export const PoolItemsResponseSchema = z.array(
  z.object({
    id: z.uuid(),
    userId: z.string(),
    poolId: z.uuid().nullable().optional(),
    originPort: z.string(),
    destPort: z.string(),
    mode: z.enum(['sea', 'air']),
    cutoffISO: z.string(),
    weightKg: z.string(),
    volumeM3: z.string(),
    length: z.string(),
    width: z.string(),
    height: z.string(),
    status: z.enum(['pending', 'pooled', 'pay_pending', 'paid', 'shipped', 'delivered']),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

export const PoolStatusUpdateSchema = z.object({
  status: z.enum(['open', 'closing', 'booked', 'in_transit', 'arrived']),
});
