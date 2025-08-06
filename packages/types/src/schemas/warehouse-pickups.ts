import { z } from 'zod/v4';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { DimsSchema } from './pools.js';
import { warehousePickupsTable } from '@containo/db';

export const PickupItemSchema = z.object({
  orderId: z.uuid(),
  address: z.string(),
  weightKg: z.number().positive(),
  dimsCm: DimsSchema,
});

export const CreatePickupSchema = z.object({
  courier: z.string(),
  scheduleAt: z.date(),
  items: z.array(PickupItemSchema).min(1),
});

export const PickupResponseSchema = z.object({
  id: z.uuid(),
  courier: z.string(),
  scheduleAt: z.date(),
  items: z.array(PickupItemSchema),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WarehousePickupSelectSchema = createSelectSchema(warehousePickupsTable);
export const WarehousePickupInsertSchema = createInsertSchema(warehousePickupsTable);
export const WarehousePickupUpdateSchema = createUpdateSchema(warehousePickupsTable);
