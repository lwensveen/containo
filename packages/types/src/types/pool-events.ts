import { z } from 'zod/v4';
import {
  EventRecentQuerySchema,
  PoolEventInsertSchema,
  PoolEventSelectSchema,
  PoolEventUpdateSchema,
} from '../schemas/pool-events.js';

export type PoolEvent = z.infer<typeof PoolEventSelectSchema>;
export type PoolEventInsert = z.infer<typeof PoolEventInsertSchema>;
export type PoolEventUpdate = z.infer<typeof PoolEventUpdateSchema>;

export type EventRecentQuery = z.infer<typeof EventRecentQuerySchema>;
