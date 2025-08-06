import { pgEnum } from 'drizzle-orm/pg-core';

export const modeEnum = pgEnum('mode_enum', ['sea', 'air']);
export const deliveryStatusEnum = pgEnum('delivery_status_enum', ['pending', 'success', 'failed']);

export const poolStatusEnum = pgEnum('pool_status_enum', [
  'open',
  'closing',
  'booked',
  'in_transit',
  'arrived',
]);

export const itemStatusEnum = pgEnum('item_status_enum', [
  'pending',
  'pooled',
  'pay_pending',
  'paid',
  'shipped',
  'delivered',
]);

export const poolEventEnum = pgEnum('pool_event_enum', [
  'pool_created',
  'item_pooled',
  'fill_80',
  'fill_90',
  'fill_100',
  'status_changed',
]);
