import crypto from 'node:crypto';

export function hmacSha256(secret: string, body: string) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}
