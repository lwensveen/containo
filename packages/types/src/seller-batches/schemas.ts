import { z } from 'zod/v4';

export const itemSchema = z.object({
  orderId: z.uuid(),
  weightKg: z.number().positive(),
  dimsCm: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const createBatchSchema = z.object({
  sellerId: z.uuid(),
  items: z.array(itemSchema).min(1),
});

export const batchResponseSchema = z.object({
  id: z.uuid(),
  sellerId: z.uuid(),
  items: z.array(itemSchema),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BatchItem = z.infer<typeof itemSchema>;
