import { z } from 'zod/v4';
import {
  PoolInsertSchema,
  PoolSelectSchema,
  PoolUpdateSchema,
  QuoteInputSchema,
  QuoteResponseSchema,
} from '../schemas/pools.js';

export type Pool = z.infer<typeof PoolSelectSchema>;
export type PoolInsert = z.infer<typeof PoolInsertSchema>;
export type PoolUpdate = z.infer<typeof PoolUpdateSchema>;

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
export type QuoteInput = z.infer<typeof QuoteInputSchema>;
