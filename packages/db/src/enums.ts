import { pgEnum } from 'drizzle-orm/pg-core';

export const modeEnum = pgEnum('mode_enum', ['sea', 'air']);
export const deliveryStatusEnum = pgEnum('delivery_status_enum', ['pending', 'success', 'failed']);

export const poolStatusEnum = pgEnum('pool_status_enum', [
  'arrived',
  'booked',
  'closing',
  'in_transit',
  'open',
]);

export const itemStatusEnum = pgEnum('item_status_enum', [
  'delivered',
  'paid',
  'pay_pending',
  'pending',
  'pooled',
  'refunded',
  'shipped',
]);

export const poolEventEnum = pgEnum('pool_event_enum', [
  'booking_confirmed',
  'booking_failed',
  'booking_requested',
  'customs_ready',
  'fill_100',
  'fill_80',
  'fill_90',
  'item_pooled',
  'payment_received',
  'payment_refunded',
  'pool_created',
  'status_changed',
]);

export const webhookEventTypeEnum = pgEnum('webhook_event_type', [
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

export const pickupStatusEnum = pgEnum('pickup_status', [
  'canceled',
  'picked_up',
  'requested',
  'scheduled',
]);

export const pickupEventTypeEnum = pgEnum('pickup_event_type', [
  'pickup_requested',
  'pickup_scheduled',
  'pickup_picked_up',
  'pickup_canceled',
]);

export const inboundStatusEnum = pgEnum('inbound_status', [
  'expected',
  'received',
  'staged_to_cfs',
  'manifested',
  'departed',
  'canceled',
]);

export const inboundEventTypeEnum = pgEnum('inbound_event_type', [
  'declared',
  'received',
  'measured',
  'staged_to_cfs',
  'manifested',
  'departed',
  'canceled',
  'priority_requested',
  'priority_shipped',
]);
