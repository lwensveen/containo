import { z } from 'zod';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { sellerBatchesTable } from '@containo/db';
import { DimsSchema } from './pools.js';

export const BatchItemSchema = z.object({
  orderId: z.uuid(),
  weightKg: z.number().positive(),
  dimsCm: DimsSchema,
  metadata: z.record(z.string(), z.any()).optional(),
});

export const CreateBatchSchema = z.object({
  sellerId: z.uuid(),
  items: z.array(BatchItemSchema).min(1),
});

export const BatchResponseSchema = z.object({
  id: z.uuid(),
  sellerId: z.uuid(),
  items: z.array(BatchItemSchema),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SellerBatchSelectSchema = createSelectSchema(sellerBatchesTable);
export const SellerBatchInsertSchema = createInsertSchema(sellerBatchesTable);
export const SellerBatchUpdateSchema = createUpdateSchema(sellerBatchesTable);
