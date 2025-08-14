import { index, integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createTimestampColumn } from '../utils.js';
import { poolsTable } from './pools.js';
import { poolItemsTable } from './pool-items.js';

export const customsDocsTable = pgTable(
  'customs_docs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    poolId: uuid('pool_id')
      .notNull()
      .references(() => poolsTable.id),
    docNumber: text('doc_number'),
    exporterName: text('exporter_name').notNull(),
    exporterAddress: text('exporter_address').notNull(),
    importerName: text('importer_name').notNull(),
    importerAddress: text('importer_address').notNull(),
    incoterm: text('incoterm').default('EXW'),
    currency: text('currency').notNull().default('USD'),
    totalValue: numeric('total_value', { precision: 14, scale: 2 }).notNull().default('0'),
    notes: text('notes'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => ({
    byPoolIdx: index('idx_customs_docs_by_pool').on(t.poolId, t.createdAt),
  })
);

export const customsDocLinesTable = pgTable(
  'customs_doc_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    docId: uuid('doc_id')
      .notNull()
      .references(() => customsDocsTable.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').references(() => poolItemsTable.id),
    position: integer('position').notNull().default(1),
    description: text('description').notNull(),
    hsCode: text('hs_code'),
    originCountry: text('origin_country'),
    quantity: integer('quantity').notNull().default(1),
    unitGrossWeightKg: numeric('unit_gross_weight_kg'),
    unitNetWeightKg: numeric('unit_net_weight_kg'),
    unitWeightKg: numeric('unit_weight_kg', { precision: 10, scale: 3 }).notNull().default('0'),
    unitValue: numeric('unit_value', { precision: 12, scale: 2 }).notNull().default('0'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => ({
    byDocIdx: index('idx_customs_lines_by_doc').on(t.docId, t.position),
  })
);
