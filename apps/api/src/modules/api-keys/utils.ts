import { createHash } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod/v4';

export function hashToken(token: string, pepper?: string) {
  return createHash('sha256')
    .update(token + (pepper ?? ''))
    .digest('hex');
}

const AdminHeaderSchema = z.object({
  authorization: z.string().optional(),
  'x-admin-token': z.string().optional(),
});

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const hdrs = AdminHeaderSchema.parse(req.headers);
  const admin = process.env.ADMIN_TOKEN ?? '';
  const presented = hdrs['x-admin-token'] || hdrs.authorization?.replace(/^Bearer\s+/i, '');
  if (!admin || presented !== admin) {
    return reply.unauthorized('Admin token required');
  }
}
