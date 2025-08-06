export declare const modeEnum: import('drizzle-orm/pg-core').PgEnum<['sea', 'air']>;
export declare const deliveryStatusEnum: import('drizzle-orm/pg-core').PgEnum<
  ['pending', 'success', 'failed']
>;
export declare const poolStatusEnum: import('drizzle-orm/pg-core').PgEnum<
  ['open', 'closing', 'booked', 'in_transit', 'arrived']
>;
export declare const itemStatusEnum: import('drizzle-orm/pg-core').PgEnum<
  ['pending', 'pooled', 'pay_pending', 'paid', 'shipped', 'delivered']
>;
export declare const poolEventEnum: import('drizzle-orm/pg-core').PgEnum<
  ['pool_created', 'item_pooled', 'fill_80', 'fill_90', 'fill_100', 'status_changed']
>;
//# sourceMappingURL=enums.d.ts.map
