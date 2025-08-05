import { eq } from 'drizzle-orm';
import { ENV } from '../../../env.js';
import { db } from '../../../db/client.js';
import { webhookDeliveries } from '../../../db/schema.js';

const BACKOFF = [15, 60, 300, 3600, 10800, 21600, 43200, 86400];

export async function scheduleRetry(id: string, attemptCount: number, lastError: string) {
  const nextAttempt = attemptCount + 1;
  const max = ENV.WEBHOOK_MAX_ATTEMPTS;
  if (nextAttempt >= max) {
    await db
      .update(webhookDeliveries)
      .set({ status: 'failed', attemptCount: nextAttempt, lastError, responseStatus: null })
      .where(eq(webhookDeliveries.id, id));
    return;
  }

  const delaySec = BACKOFF[Math.min(nextAttempt - 1, BACKOFF.length - 1)]!;
  const next = new Date(Date.now() + delaySec * 1000);

  await db
    .update(webhookDeliveries)
    .set({
      attemptCount: nextAttempt,
      nextAttemptAt: next as any,
      lastError,
      responseStatus: null,
    })
    .where(eq(webhookDeliveries.id, id));
}
