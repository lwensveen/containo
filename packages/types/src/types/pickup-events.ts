import { z } from 'zod/v4';
import { PickupEventRecordSchema, PickupEventTypeEnum } from '../schemas/index.js';

export type PickupEventType = z.infer<typeof PickupEventTypeEnum>;
export type PickupEvent = z.infer<typeof PickupEventRecordSchema>;
