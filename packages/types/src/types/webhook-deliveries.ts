import { z } from 'zod/v4';
import {
  WebhookDeliveryPublicSchema,
  WebhookDeliveryWithSubSchema,
} from '../schemas/webhook-deliveries.js';

export type WebhookDelivery = z.infer<typeof WebhookDeliveryPublicSchema>;
export type WebhookDeliveryWithSub = z.infer<typeof WebhookDeliveryWithSubSchema>;
