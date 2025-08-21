import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { convertPaidInboundToPoolItem } from '../inbound/services/convert.js';
import { emitInboundEvent } from '../events/services/emit-inbound-event.js';
import { emitPoolEvent } from '../events/services/emit-pool-event.js';
import { db, paymentsTable, poolItemsTable } from '@containo/db';
import { eq } from 'drizzle-orm';
import { recomputePoolFill } from '../pools/services/recompute-fill.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-07-30.basil' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function paymentsWebhook(app: FastifyInstance) {
  app.post('/payments/webhook', { config: { rawBody: true } }, async (req, reply) => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    if (!sig) return reply.code(400).send({ error: 'Missing signature' });

    let event: Stripe.Event;
    try {
      const raw = (req as any).rawBody as Buffer;
      event = stripe.webhooks.constructEvent(raw, sig, endpointSecret);
    } catch (err: any) {
      return reply.code(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const inboundId = session.metadata?.inboundId || '';
      const itemId = session.metadata?.itemId || '';
      const sessionId = session.id;
      const amountCents = session.amount_total ?? 0;
      const currency = (session.currency || 'usd').toUpperCase();

      if (inboundId) {
        try {
          await convertPaidInboundToPoolItem({ inboundId, stripeSessionId: sessionId });

          await emitInboundEvent({
            inboundId,
            type: 'priority_paid',
            payload: {
              sessionId,
              amountUsd: amountCents / 100,
              currency,
            },
          });
        } catch (e) {
          app.log.error(e, 'convertPaidInboundToPoolItem failed');
        }
      }

      if (itemId) {
        const [row] = await db
          .update(poolItemsTable)
          .set({
            status: 'paid',
            stripeSessionId: sessionId,
            updatedAt: new Date(),
          })
          .where(eq(poolItemsTable.id, itemId))
          .returning();

        const piId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : (session.payment_intent as Stripe.PaymentIntent | null)?.id;

        await db
          .insert(paymentsTable)
          .values({
            itemId,
            stripeSessionId: sessionId,
            stripePaymentIntentId: piId ?? null,
            amountCents,
            currency,
            status: 'paid',
            paidAt: new Date(),
          })
          .onConflictDoUpdate({
            target: paymentsTable.stripeSessionId,
            set: {
              amountCents,
              currency,
              status: 'paid',
              paidAt: new Date(),
              updatedAt: new Date(),
            },
          });

        if (row?.poolId) {
          await emitPoolEvent({
            poolId: row.poolId,
            type: 'status_changed',
            payload: { itemId: row.id, itemStatus: 'paid' },
          });

          await recomputePoolFill(row.poolId);

          await emitPoolEvent({
            poolId: row.poolId,
            type: 'payment_received',
            payload: {
              itemId: row.id,
              amountUsd: amountCents / 100,
              currency,
              sessionId,
            },
          });
        }
      }

      return reply.send({ ok: true });
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const inboundId = session.metadata?.inboundId || '';
      const itemId = session.metadata?.itemId || '';

      if (inboundId) {
        try {
          await emitInboundEvent({
            inboundId,
            type: 'payment_expired',
            payload: { sessionId: session.id },
          });
        } catch (e) {
          app.log.error(e, 'emitInboundEvent(payment_expired) failed');
        }
      }

      if (itemId) {
        const [it] = await db
          .select()
          .from(poolItemsTable)
          .where(eq(poolItemsTable.id, itemId))
          .limit(1);

        if (it && it.status === 'pay_pending') {
          const newStatus: 'pooled' | 'pending' = it.poolId ? 'pooled' : 'pending';

          const [updated] = await db
            .update(poolItemsTable)
            .set({
              status: newStatus,
              updatedAt: new Date(),
            })
            .where(eq(poolItemsTable.id, itemId))
            .returning();

          if (updated?.poolId) {
            await emitPoolEvent({
              poolId: updated.poolId,
              type: 'status_changed',
              payload: { itemId: updated.id, itemStatus: newStatus },
            });
          }

          await db
            .update(paymentsTable)
            .set({ status: 'canceled', updatedAt: new Date() })
            .where(eq(paymentsTable.stripeSessionId, session.id));
        }
      }

      return reply.send({ ok: true });
    }

    return reply.send({ ok: true });
  });
}
