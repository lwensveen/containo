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
  'pool_created',
  'status_changed',
]);
