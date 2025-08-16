import { z } from 'zod/v4';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { webhookDeliveriesTable } from '@containo/db';
import { PoolEventTypeEnum } from '../types/index.js';

export const DeliveryStatusEnum = z.enum(['pending', 'success', 'failed']);

export const WebhookDeliverySelectSchema = createSelectSchema(webhookDeliveriesTable, {
  eventType: PoolEventTypeEnum,
  status: DeliveryStatusEnum,
});
export const WebhookDeliveryInsertSchema = createInsertSchema(webhookDeliveriesTable, {
  eventType: PoolEventTypeEnum,
  status: DeliveryStatusEnum,
});
export const WebhookDeliveryUpdateSchema = createUpdateSchema(webhookDeliveriesTable, {
  eventType: PoolEventTypeEnum,
  status: DeliveryStatusEnum,
});

export const WebhookDeliverySelectCoercedSchema = WebhookDeliverySelectSchema.extend({
  attemptCount: z.coerce.number().int(),
  responseStatus: z.coerce.number().int().nullable().optional(),
  nextAttemptAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const WebhookDeliveryPublicSchema = z.object({
  id: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  eventId: z.string().uuid(),
  eventType: PoolEventTypeEnum,
  payload: z.record(z.string(), z.unknown()),
  attemptCount: z.number().int(),
  nextAttemptAt: z.string(),
  lastError: z.string().nullable().optional(),
  responseStatus: z.number().int().nullable().optional(),
  status: DeliveryStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const WebhookDeliveryWithSubSchema = WebhookDeliveryPublicSchema.extend({
  subscriptionUrl: z.string().url(),
  subscriptionIsActive: z.boolean(),
});

export const DeliveryIdParamSchema = z.object({ id: z.string().uuid() });

export const DeliveriesListQuerySchema = z.object({
  status: DeliveryStatusEnum.optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const DeliveriesListResponseSchema = z.array(WebhookDeliveryPublicSchema);

export const WebhookEventTypeEnum = z.enum([
  'pool_created',
  'item_pooled',
  'fill_80',
  'fill_90',
  'fill_100',
  'status_changed',
  'booking_requested',
  'booking_confirmed',
  'booking_failed',
  'customs_ready',
  'payment_received',
  'payment_refunded',
  'pickup_requested',
  'pickup_scheduled',
  'pickup_picked_up',
  'pickup_canceled',
]);
