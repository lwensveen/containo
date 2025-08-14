import { apiKeysTable, db } from '@containo/db';
import { z } from 'zod/v4';
import { ApiKeyRecordSchema } from '@containo/types';

export type ApiKeyRecord = z.infer<typeof ApiKeyRecordSchema>;

export async function listApiKeys(): Promise<ApiKeyRecord[]> {
  const rows = await db.select().from(apiKeysTable);

  return rows.map((r) => ({ ...r, lastUsedAt: r.lastUsedAt ?? null }));
}
