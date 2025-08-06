import { db, sellerBatches } from '@containo/db';
import { desc, eq, InferSelectModel } from 'drizzle-orm';
import { z } from 'zod/v4';
import { createBatchSchema } from '@containo/types';

export async function createSellerBatch(data: z.infer<typeof createBatchSchema>) {
  const [batch] = await db
    .insert(sellerBatches)
    .values({
      sellerId: data.sellerId,
      items: data.items,
    })
    .returning();

  return batch;
}

export async function listSellerBatches(
  sellerId?: string
): Promise<InferSelectModel<typeof sellerBatches>[]> {
  return db
    .select()
    .from(sellerBatches)
    .where(sellerId ? eq(sellerBatches.sellerId, sellerId) : undefined)
    .orderBy(desc(sellerBatches.createdAt))
    .execute();
}
