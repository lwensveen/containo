import { apiKeysTable, db } from '@containo/db';
import { hashToken } from '../utils.js';
import { generateApiKey } from '../../../plugins/api-key-auth.js';
import { CreateApiKeyInput, CreateApiKeyResult } from '@containo/types';

export async function createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
  const token = generateApiKey();
  const tokenHash = hashToken(token, process.env.API_KEY_PEPPER);

  const rows = await db
    .insert(apiKeysTable)
    .values({
      name: input.name,
      ownerId: input.ownerId,
      tokenHash,
      scopes: input.scopes ?? [],
    })
    .returning();

  const row = rows[0];
  if (!row) throw new Error('Failed to create API key');

  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    scopes: row.scopes,
    isActive: row.isActive,
    createdAt: row.createdAt!,
    lastUsedAt: row.lastUsedAt ?? null,
    token,
    tokenHash: '',
  };
}
