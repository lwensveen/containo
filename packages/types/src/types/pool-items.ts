import { z } from 'zod/v4';
import { PoolItemSelectCoercedSchema, PoolItemSelectSchema } from '../schemas/pool-items.js';

export type PoolItem = z.infer<typeof PoolItemSelectSchema>;
export type PoolItemCoerced = z.infer<typeof PoolItemSelectCoercedSchema>;
