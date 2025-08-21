import { accountsTable } from './auth/accounts.js';
import { apiKeysTable } from './auth/api-keys.js';
import { customsDocLinesTable, customsDocsTable } from './customs-docs.js';
import { idempotencyKeysTable } from './idempotency-keys.js';
import { inboundEventsTable } from './inbound-events.js';
import { inboundParcelsTable } from './inbound-parcels.js';
import { intentsTable } from './intents.js';
import { laneRatesTable } from './lane-rates.js';
import { passkeysTable } from './auth/passkeys.js';
import { paymentsTable } from './payments.js';
import { pickupEventsTable } from './pickup-events.js';
import { pickupsTable } from './pickups.js';
import { poolEventsTable } from './pool-events.js';
import { poolItemsTable } from './pool-items.js';
import { poolsTable } from './pools.js';
import { sellerBatchesTable } from './seller-batches.js';
import { sessionsTable } from './auth/sessions.js';
import { userHubCodesTable } from './user-hub-codes.js';
import { usersTable } from './users/users.js';
import { verificationsTable } from './auth/verifications.js';
import { warehousePickupsTable } from './warehouse-pickups.js';
import { webhookDeliveriesTable } from './webhook-deliveries.js';
import { webhookSubscriptionsTable } from './webhook-subscriptions.js';

export * from './auth/accounts.js';
export * from './auth/api-keys.js';
export * from './auth/passkeys.js';
export * from './auth/sessions.js';
export * from './auth/verifications.js';
export * from './customs-docs.js';
export * from './idempotency-keys.js';
export * from './inbound-events.js';
export * from './inbound-parcels.js';
export * from './intents.js';
export * from './lane-rates.js';
export * from './payments.js';
export * from './pickup-events.js';
export * from './pickups.js';
export * from './pool-events.js';
export * from './pool-items.js';
export * from './pools.js';
export * from './seller-batches.js';
export * from './user-hub-codes.js';
export * from './users/users.js';
export * from './warehouse-pickups.js';
export * from './webhook-deliveries.js';
export * from './webhook-subscriptions.js';

export const schema = {
  accountsTable,
  apiKeysTable,
  customsDocLinesTable,
  customsDocsTable,
  idempotencyKeysTable,
  inboundEventsTable,
  inboundParcelsTable,
  intentsTable,
  laneRatesTable,
  passkeysTable,
  paymentsTable,
  pickupEventsTable,
  pickupsTable,
  poolEventsTable,
  poolItemsTable,
  poolsTable,
  sellerBatchesTable,
  sessionsTable,
  userHubCodesTable,
  usersTable,
  verificationsTable,
  warehousePickupsTable,
  webhookDeliveriesTable,
  webhookSubscriptionsTable,
};
