import { z } from 'zod/v4';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { intentsTable } from '@containo/db';

export const IntentSelectSchema = createSelectSchema(intentsTable);
export const IntentInsertSchema = createInsertSchema(intentsTable);
export const IntentUpdateSchema = createUpdateSchema(intentsTable);

export const IntentRecordSchema = IntentSelectSchema;

export const IntentSelectCoercedSchema = IntentSelectSchema.extend({
  weightKg: z.coerce.number(),
  dimsL: z.coerce.number(),
  dimsW: z.coerce.number(),
  dimsH: z.coerce.number(),

  cutoffAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export const IntentByIdSchema = z.object({ id: z.string().min(1) });

export const IntentByIdemKeySchema = z.object({
  idempotencyKey: z.string().min(1),
});

export const IntentsListQuerySchema = z.object({
  originPort: z.string().length(3).optional(),
  destPort: z.string().length(3).optional(),
  mode: z.enum(['sea', 'air']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export const IntentPublicSchema = z.object({
  id: z.string().min(1),
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['sea', 'air']),
  cutoffAt: z.any(),
  weightKg: z.coerce.number(),
  dimsL: z.coerce.number(),
  dimsW: z.coerce.number(),
  dimsH: z.coerce.number(),
  createdAt: z.any(),
});

export const IntentResponseSchema = z.object({
  id: z.string().uuid(),
  accepted: z.literal(true),
  volumeM3: z.number(),
});

export const IntentInputSchema = z.object({
  userId: z.string().min(1),
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['sea', 'air']),
  cutoffISO: z.string(),
  weightKg: z.coerce.number().positive(),
  dimsCm: z.object({
    length: z.coerce.number().positive(),
    width: z.coerce.number().positive(),
    height: z.coerce.number().positive(),
  }),
});

export const IntentsListResponseSchema = z.array(IntentPublicSchema);
