import { z } from 'zod/v4';
import {
  PickupCreateSchema,
  PickupIdParamSchema,
  PickupListQuerySchema,
  PickupListResponseSchema,
  PickupRecordSchema,
  PickupStatusUpdateSchema,
} from '../schemas/pickups.js';

export type Pickup = z.infer<typeof PickupRecordSchema>;
export type PickupCreate = z.infer<typeof PickupCreateSchema>;
export type PickupStatusUpdate = z.infer<typeof PickupStatusUpdateSchema>;
export type PickupIdParam = z.infer<typeof PickupIdParamSchema>;
export type PickupListQuery = z.infer<typeof PickupListQuerySchema>;
export type PickupListResponse = z.infer<typeof PickupListResponseSchema>;
