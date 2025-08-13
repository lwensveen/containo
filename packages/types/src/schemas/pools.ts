import { z } from 'zod/v4';
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

export const PoolIdParamSchema = z.object({
  id: z.uuid(),
});

export const PoolStatusUpdateSchema = z.object({
  status: z.enum(['open', 'closing', 'booked', 'in_transit', 'arrived']),
});
