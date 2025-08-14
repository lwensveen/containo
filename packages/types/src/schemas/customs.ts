import { z } from 'zod/v4';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { customsDocLinesTable, customsDocsTable } from '@containo/db';

export const CustomsDocSelectSchema = createSelectSchema(customsDocsTable);
export const CustomsDocLineSelectSchema = createSelectSchema(customsDocLinesTable);
export const CustomsDocInsertSchema = createInsertSchema(customsDocsTable);
export const CustomsDocUpdateSchema = createUpdateSchema(customsDocsTable);

export const CustomsDocLineInsertSchema = createInsertSchema(customsDocLinesTable, {
  quantity: z.coerce.number().int().positive(),
  unitWeightKg: z.coerce.number().nonnegative().optional().nullable(),
  unitGrossWeightKg: z.coerce.number().nonnegative().optional().nullable(),
  unitNetWeightKg: z.coerce.number().nonnegative().optional().nullable(),
  unitValue: z.coerce.number().nonnegative().optional().nullable(),
});

export const CustomsDocLineUpdateSchema = createUpdateSchema(customsDocLinesTable, {
  quantity: z.coerce.number().int().positive().optional(),
  unitWeightKg: z.coerce.number().nonnegative().optional().nullable(),
  unitGrossWeightKg: z.coerce.number().nonnegative().optional().nullable(),
  unitNetWeightKg: z.coerce.number().nonnegative().optional().nullable(),
  unitValue: z.coerce.number().nonnegative().optional().nullable(),
});

export const CustomsLineInputSchema = z.object({
  description: z.string().min(1),
  hsCode: z.string().min(4).max(12).optional().nullable(),
  originCountry: z.string().length(2).optional().nullable(),
  quantity: z.coerce.number().int().positive().default(1),
  unitGrossWeightKg: z.coerce.number().optional(),
  unitNetWeightKg: z.coerce.number().optional(),
  unitWeightKg: z.coerce.number().nonnegative(),
  unitValue: z.coerce.number().nonnegative(),
  itemId: z.string().uuid().optional().nullable(),
});

export const CustomsDocCreateSchema = z.object({
  poolId: z.string().uuid(),
  docNumber: z.string().optional().nullable(),
  exporterName: z.string().min(1),
  exporterAddress: z.string().min(1),
  importerName: z.string().min(1),
  importerAddress: z.string().min(1),
  incoterm: z.string().min(3).max(10).default('EXW'),
  currency: z.string().length(3).default('USD'),
  notes: z.string().optional().nullable(),
  lines: z.array(CustomsLineInputSchema).min(1),
});

export const CustomsDocSelectCoercedSchema = CustomsDocSelectSchema.extend({
  totalValue: z.coerce.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const CustomsDocLineSelectCoercedSchema = CustomsDocLineSelectSchema.extend({
  position: z.coerce.number().optional(),
  quantity: z.coerce.number(),
  unitWeightKg: z.coerce.number().optional().nullable(),
  unitGrossWeightKg: z.coerce.number().optional().nullable(),
  unitNetWeightKg: z.coerce.number().optional().nullable(),
  unitValue: z.coerce.number().optional().nullable(),
});

export const CustomsDocRecordSchema = CustomsDocSelectCoercedSchema.extend({
  lines: z.array(
    CustomsDocLineSelectCoercedSchema.pick({
      id: true,
      position: true,
      description: true,
      hsCode: true,
      originCountry: true,
      quantity: true,
      unitWeightKg: true,
      unitGrossWeightKg: true,
      unitNetWeightKg: true,
      unitValue: true,
      itemId: true,
    })
  ),
});

export const CustomsDocIdParamSchema = z.object({ id: z.string().uuid() });

export const CustomsDocListQuerySchema = z.object({
  poolId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const CustomsDocListResponseSchema = z.array(
  CustomsDocSelectCoercedSchema.pick({
    id: true,
    poolId: true,
    docNumber: true,
    exporterName: true,
    importerName: true,
    currency: true,
    totalValue: true,
    createdAt: true,
  })
);
