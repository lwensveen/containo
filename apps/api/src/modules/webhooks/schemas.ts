import { z } from 'zod/v4';

export const WebhookCreateSchema = z.object({
  url: z.url(),
  events: z.string().min(1).default('*'),
  secret: z.string().min(8),
});

export const WebhookRecordSchema = z.object({
  id: z.uuid(),
  url: z.url(),
  events: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const WebhookListResponse = z.array(WebhookRecordSchema);

export const WebhookIdParamSchema = z.object({
  id: z.uuid(),
});
