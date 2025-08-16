import { z } from 'zod/v4';
import {
  WebhookDeliveryPublicSchema,
  WebhookDeliveryWithSubSchema,
  WebhookEventTypeEnum,
} from '../schemas/index.js';

export type WebhookDelivery = z.infer<typeof WebhookDeliveryPublicSchema>;
export type WebhookDeliveryWithSub = z.infer<typeof WebhookDeliveryWithSubSchema>;
export type WebhookEventType = z.infer<typeof WebhookEventTypeEnum>;
