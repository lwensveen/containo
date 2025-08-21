import { z } from 'zod/v4';
import {
  InboundDeclareSchema,
  InboundEventSchema,
  InboundReceiveSchema,
} from '../schemas/index.js';

export type InboundDeclare = z.infer<typeof InboundDeclareSchema>;
export type InboundReceive = z.infer<typeof InboundReceiveSchema>;

export const InboundEventTypeSchema = z.enum([
  'declared',
  'received',
  'measured',
  'staged_to_cfs',
  'manifested',
  'departed',
  'canceled',
  'priority_requested',
  'priority_shipped',
  'priority_paid',
  'payment_expired',
]);
export type InboundEventType = z.infer<typeof InboundEventTypeSchema>;
export type InboundEvent = z.infer<typeof InboundEventSchema>;
