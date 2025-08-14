import type { FastifyPluginAsync } from 'fastify';
import { apiKeysTable, db } from '@containo/db';
import { and, eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';

declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: {
      id: string;
      ownerId: string;
      scopes: string[];
    };
  }
}

function hashToken(token: string, pepper?: string) {
  return createHash('sha256')
    .update(token + (pepper ?? ''))
    .digest('hex');
}

export function generateApiKey(): string {
  return 'ck_' + randomBytes(24).toString('base64url'); // ~32 chars
}

export const apiKeyAuthPlugin: FastifyPluginAsync = async (app) => {
  const PEPPER = process.env.API_KEY_PEPPER ?? '';

  app.decorate('requireApiKey', (requiredScopes?: string[]) => {
    return async (req: any, reply: any) => {
      const hdr = req.headers['authorization'] || req.headers['x-api-key'];
      const token =
        typeof hdr === 'string' && hdr.startsWith('Bearer ')
          ? hdr.slice(7).trim()
          : typeof hdr === 'string'
            ? hdr.trim()
            : null;

      if (!token) return reply.unauthorized('Missing API key');

      const hash = hashToken(token, PEPPER);
      const rows = await db
        .select()
        .from(apiKeysTable)
        .where(and(eq(apiKeysTable.tokenHash, hash), eq(apiKeysTable.isActive, true)))
        .limit(1);

      const row = rows[0];
      if (!row) return reply.unauthorized('Invalid API key');

      if (requiredScopes?.length) {
        const ok = requiredScopes.every((s) => row.scopes.includes(s));
        if (!ok) return reply.forbidden('Missing required scope(s)');
      }

      req.apiKey = { id: row.id, ownerId: row.ownerId, scopes: row.scopes };

      db.update(apiKeysTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeysTable.id, row.id))
        .catch(() => {});
    };
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    requireApiKey: (scopes?: string[]) => (req: any, reply: any) => Promise<void>;
  }
}
