import { z } from 'zod/v4';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { apiKeysTable } from '@containo/db';

export const ApiKeySelectSchema = createSelectSchema(apiKeysTable);
export const ApiKeyInsertSchema = createInsertSchema(apiKeysTable);
export const ApiKeyUpdateSchema = createUpdateSchema(apiKeysTable);

export const ApiKeyRecordSchema = ApiKeySelectSchema.extend({
  lastUsedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1),
  ownerId: z.string().uuid(),
  scopes: z.array(z.string()).default([]),
});

export const ApiKeyCreateResponseSchema = ApiKeyRecordSchema.extend({
  token: z.string(),
});
