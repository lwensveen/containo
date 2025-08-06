import { z } from 'zod/v4';
import {
  WarehousePickupInsertSchema,
  WarehousePickupSelectSchema,
  WarehousePickupUpdateSchema,
} from '../schemas/warehouse-pickups.js';

export type WarehousePickup = z.infer<typeof WarehousePickupSelectSchema>;
export type WarehousePickupInsert = z.infer<typeof WarehousePickupInsertSchema>;
export type WarehousePickupUpdate = z.infer<typeof WarehousePickupUpdateSchema>;
