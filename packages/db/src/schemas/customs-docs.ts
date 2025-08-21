import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createTimestampColumn } from '../utils.js';
import { poolsTable } from './pools.js';
import { poolItemsTable } from './pool-items.js';

export const customsDocsTable = pgTable(
  'customs_docs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    poolId: uuid('pool_id')
      .notNull()
      .references(() => poolsTable.id, { onDelete: 'cascade' }),
    docNumber: text('doc_number'),
    exporterName: text('exporter_name').notNull(),
    exporterAddress: text('exporter_address').notNull(),
    importerName: text('importer_name').notNull(),
    importerAddress: text('importer_address').notNull(),
    incoterm: text('incoterm').default('EXW'),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    totalValue: numeric('total_value', { precision: 14, scale: 2 }).notNull().default('0'),
    notes: text('notes'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => [
    index('idx_customs_docs_by_pool').on(t.poolId, t.createdAt),
    uniqueIndex('ux_customs_doc_pool_docnum').on(t.poolId, t.docNumber),
    sql`CONSTRAINT chk_customs_currency_cc
        CHECK (char_length(${t.currency}) = 3 AND ${t.currency} = upper(${t.currency}))`,
    sql`CONSTRAINT chk_customs_incoterm
        CHECK (${t.incoterm} IS NULL OR ${t.incoterm} IN ('EXW','FCA','FOB','CFR','CIF','CIP','DAP','DPU','DDP'))`,
    sql`CONSTRAINT chk_customs_total_value_nonneg
        CHECK (${t.totalValue} >= 0)`,
  ]
);

export const customsDocLinesTable = pgTable(
  'customs_doc_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    docId: uuid('doc_id')
      .notNull()
      .references(() => customsDocsTable.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').references(() => poolItemsTable.id, { onDelete: 'set null' }),
    position: integer('position').notNull().default(1),
    description: text('description').notNull(),
    hsCode: varchar('hs_code', { length: 10 }),
    originCountry: varchar('origin_country', { length: 2 }),
    quantity: integer('quantity').notNull().default(1),
    unitGrossWeightKg: numeric('unit_gross_weight_kg'),
    unitNetWeightKg: numeric('unit_net_weight_kg'),
    unitWeightKg: numeric('unit_weight_kg', { precision: 10, scale: 3 }).notNull().default('0'),
    unitValue: numeric('unit_value', { precision: 12, scale: 2 }).notNull().default('0'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => [
    index('idx_customs_lines_by_doc').on(t.docId, t.position),
    index('idx_customs_lines_by_item').on(t.itemId),
    uniqueIndex('ux_customs_line_doc_position').on(t.docId, t.position),
    sql`CONSTRAINT chk_customs_line_qty_pos
        CHECK (${t.quantity} > 0 AND ${t.position} > 0)`,
    sql`CONSTRAINT chk_customs_line_weights_nonneg
        CHECK (${t.unitWeightKg} >= 0
           AND coalesce(${t.unitGrossWeightKg}, 0) >= 0
           AND coalesce(${t.unitNetWeightKg}, 0) >= 0)`,
    sql`CONSTRAINT chk_customs_line_weight_rel
        CHECK (${t.unitGrossWeightKg} IS NULL OR ${t.unitNetWeightKg} IS NULL OR ${t.unitGrossWeightKg} >= ${t.unitNetWeightKg})`,
    sql`CONSTRAINT chk_customs_line_value_nonneg
        CHECK (${t.unitValue} >= 0)`,
    sql`CONSTRAINT chk_customs_origin_cc
        CHECK (${t.originCountry} IS NULL OR (char_length(${t.originCountry}) = 2 AND ${t.originCountry} = upper(${t.originCountry})))`,
  ]
);
