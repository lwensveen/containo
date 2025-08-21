import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, webhookDeliveriesTable, webhookSubscriptionsTable } from '@containo/db';

const ListQuery = z.object({
  status: z.enum(['pending', 'success', 'failed']).default('failed'),
  limit: z.coerce.number().int().positive().max(500).default(100),
});

export default async function adminWebhooksRoutes(app: FastifyInstance) {
  app.get('/deliveries', { schema: { querystring: ListQuery as any } }, async (req, reply) => {
    const { status, limit } = ListQuery.parse(req.query);

    const rows = await db
      .select({
        id: webhookDeliveriesTable.id,
        subscriptionId: webhookDeliveriesTable.subscriptionId,
        eventId: webhookDeliveriesTable.eventId,
        eventType: webhookDeliveriesTable.eventType,
        payload: webhookDeliveriesTable.payload,
        attemptCount: webhookDeliveriesTable.attemptCount,
        nextAttemptAt: webhookDeliveriesTable.nextAttemptAt,
        lastError: webhookDeliveriesTable.lastError,
        responseStatus: webhookDeliveriesTable.responseStatus,
        status: webhookDeliveriesTable.status,
        createdAt: webhookDeliveriesTable.createdAt,
        updatedAt: webhookDeliveriesTable.updatedAt,
        url: webhookSubscriptionsTable.url,
        isActive: webhookSubscriptionsTable.isActive,
      })
      .from(webhookDeliveriesTable)
      .innerJoin(
        webhookSubscriptionsTable,
        eq(webhookSubscriptionsTable.id, webhookDeliveriesTable.subscriptionId)
      )
      .where(
        and(
          inArray(webhookDeliveriesTable.status, [status]), // exact status
          sql`true`
        )
      )
      .orderBy(desc(webhookDeliveriesTable.updatedAt), desc(webhookDeliveriesTable.createdAt))
      .limit(limit);

    reply.send(rows);
  });

  app.post(
    '/deliveries/:id/retry',
    { schema: { params: z.object({ id: z.string().uuid() }) as any } },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const [row] = await db
        .update(webhookDeliveriesTable)
        .set({
          status: 'pending',
          attemptCount: 0,
          nextAttemptAt: new Date(),
          lastError: null,
          responseStatus: null,
          updatedAt: new Date(),
        })
        .where(eq(webhookDeliveriesTable.id, id))
        .returning();

      if (!row) return reply.notFound('Delivery not found');
      reply.send({ ok: true });
    }
  );
}
