import { z } from 'zod/v4';
import {
  BatchItemSchema,
  SellerBatchInsertSchema,
  SellerBatchSelectSchema,
  SellerBatchUpdateSchema,
} from '../schemas/seller-batches.js';

export type BatchItem = z.infer<typeof BatchItemSchema>;
export type SellerBatch = z.infer<typeof SellerBatchSelectSchema>;
export type SellerBatchInsert = z.infer<typeof SellerBatchInsertSchema>;
export type SellerBatchUpdate = z.infer<typeof SellerBatchUpdateSchema>;
