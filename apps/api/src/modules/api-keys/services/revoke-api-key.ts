import { apiKeysTable, db } from '@containo/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { ApiKeyRecordSchema } from '@containo/types';

export type ApiKeyRecord = z.infer<typeof ApiKeyRecordSchema>;

export async function revokeApiKey(id: string): Promise<ApiKeyRecord | null> {
  const [row] = await db
    .update(apiKeysTable)
    .set({ isActive: false })
    .where(eq(apiKeysTable.id, id))
    .returning();

  return row ?? null;
}
