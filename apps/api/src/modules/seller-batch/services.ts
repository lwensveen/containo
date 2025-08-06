import { db, sellerBatchesTable } from '@containo/db';
import { desc, eq, InferSelectModel } from 'drizzle-orm';
import { z } from 'zod/v4';
import { CreateBatchSchema } from '@containo/types';

export async function createSellerBatch(data: z.infer<typeof CreateBatchSchema>) {
  const [batch] = await db
    .insert(sellerBatchesTable)
    .values({
      sellerId: data.sellerId,
      items: data.items,
    })
    .returning();

  return batch;
}

export async function listSellerBatches(
  sellerId?: string
): Promise<InferSelectModel<typeof sellerBatchesTable>[]> {
  return db
    .select()
    .from(sellerBatchesTable)
    .where(sellerId ? eq(sellerBatchesTable.sellerId, sellerId) : undefined)
    .orderBy(desc(sellerBatchesTable.createdAt))
    .execute();
}
