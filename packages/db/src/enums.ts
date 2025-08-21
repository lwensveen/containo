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
  'booking_confirmed',
  'booking_failed',
  'booking_requested',
  'customs_ready',
  'fill_100',
  'fill_80',
  'fill_90',
  'inbound_canceled',
  'inbound_declared',
  'inbound_departed',
  'inbound_manifested',
  'inbound_measured',
  'inbound_payment_expired',
  'inbound_priority_paid',
  'inbound_priority_requested',
  'inbound_received',
  'inbound_staged_to_cfs',
  'item_pooled',
  'payment_received',
  'payment_refunded',
  'pickup_canceled',
  'pickup_picked_up',
  'pickup_requested',
  'pickup_scheduled',
  'pool_created',
  'status_changed',
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
  'priority_paid',
  'payment_expired',
]);
