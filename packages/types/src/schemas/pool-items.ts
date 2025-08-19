import { z } from 'zod/v4';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { poolItemsTable } from '@containo/db';

export const PoolItemSelectSchema = createSelectSchema(poolItemsTable);
export const PoolItemInsertSchema = createInsertSchema(poolItemsTable);
export const PoolItemUpdateSchema = createUpdateSchema(poolItemsTable);

export const PoolItemRecordSchema = PoolItemSelectSchema;

export const PoolItemsResponseSchema = z.array(PoolItemSelectSchema);

export const PoolItemSelectCoercedSchema = PoolItemSelectSchema.extend({
  weightKg: z.coerce.number(),
  volumeM3: z.coerce.number(),
  length: z.coerce.number(),
  width: z.coerce.number(),
  height: z.coerce.number(),
});

export const PoolItemsByLaneQuerySchema = z.object({
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['sea', 'air']),
  cutoffAt: z.string(),
  status: z.enum(['pending', 'pooled']).optional(),
});
