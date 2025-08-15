import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { z } from 'zod/v4';
import { db, poolItemsTable } from '@containo/db';
import { eq } from 'drizzle-orm';
import { emitPoolEvent } from '../events/services/emit-pool-event.js';
import { renderReceiptPdf } from './services/render-receipt.js';

const AdminHeaderSchema = z.object({
  authorization: z.string().optional(),
  'x-admin-token': z.string().optional(),
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

const CheckoutBodySchema = z.object({
  itemId: z.string().uuid(),
  amountUsd: z.number().positive(),
  currency: z
    .string()
    .length(3)
    .transform((s) => s.toLowerCase()),
  description: z.string().max(200).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const CheckoutRespSchema = z.object({ url: z.string().url() });

const RefundBody = z.object({
  // Prefer session id to avoid extra DB schema
  sessionId: z.string().min(10),
  amountUsd: z.number().positive().optional(),
  reason: z.enum(['requested_by_customer', 'fraudulent', 'duplicate']).optional(),
});

export default async function paymentsRoutes(app: FastifyInstance) {
  app.post<{ Body: z.infer<typeof CheckoutBodySchema>; Reply: z.infer<typeof CheckoutRespSchema> }>(
    '/checkout',
    {
      schema: {
        body: CheckoutBodySchema,
        response: { 200: CheckoutRespSchema },
      },
    },
    async (req, reply) => {
      const { itemId, amountUsd, currency, description, successUrl, cancelUrl } = req.body;

      // Basic sanity: ensure item exists (MVP read)
      const [it] = await db
        .select()
        .from(poolItemsTable)
        .where(eq(poolItemsTable.id, itemId))
        .limit(1);
      if (!it) return reply.notFound('Item not found');

      if (it.status !== 'paid') {
        const [updated] = await db
          .update(poolItemsTable)
          .set({ status: 'pay_pending' })
          .where(eq(poolItemsTable.id, itemId))
          .returning();

        if (updated?.poolId) {
          await emitPoolEvent({
            poolId: updated.poolId,
            type: 'status_changed',
            payload: { itemId: updated.id, itemStatus: 'pay_pending' },
          });
        }
      }

      const base = process.env.PUBLIC_WEB_URL || 'http://localhost:3000';
      const success_url = successUrl || `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = cancelUrl || `${base}/checkout/cancel`;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: Math.round(amountUsd * 100), // cents
              product_data: {
                name:
                  description || `Containo ${it.originPort ?? ''} → ${it.destPort ?? ''}`.trim(),
              },
            },
            quantity: 1,
          },
        ],
        success_url,
        cancel_url,
        metadata: {
          itemId,
        },
      });

      return reply.send({ url: session.url! });
    }
  );

  app.post('/stripe/webhook', {
    config: { rawBody: true },
    handler: async (req, reply) => {
      const sig = req.headers['stripe-signature'] as string | undefined;
      const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
      if (!sig || !secret) return reply.code(400).send('missing sig/secret');

      let event: Stripe.Event;
      try {
        const raw = (req as any).rawBody as Buffer;
        event = stripe.webhooks.constructEvent(raw, sig, secret);
      } catch (err: any) {
        req.log.error({ err }, 'stripe webhook signature verify failed');
        return reply.code(400).send('invalid signature');
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const itemId = session.metadata?.itemId;

        if (itemId) {
          const [row] = await db
            .update(poolItemsTable)
            .set({ status: 'paid', stripeSessionId: session.id })
            .where(eq(poolItemsTable.id, itemId))
            .returning();

          if (row) {
            if (row.poolId) {
              await emitPoolEvent({
                poolId: row.poolId,
                type: 'status_changed',
                payload: { itemId: row.id, itemStatus: 'paid' },
              });

              await emitPoolEvent({
                poolId: row.poolId,
                type: 'payment_received',
                payload: {
                  itemId: row.id,
                  amountUsd: (session.amount_total ?? 0) / 100,
                  currency: session.currency?.toUpperCase(),
                  sessionId: session.id,
                },
              });
            }
          }
        }
      }

      if (event.type === 'checkout.session.expired') {
      }

      return reply.code(200).send({ received: true });
    },
  });

  app.post<{ Body: z.infer<typeof RefundBody> }>(
    '/refunds',
    {
      schema: { body: RefundBody, response: { 200: z.object({ ok: z.literal(true) }) } },
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
      preHandler: async (req, reply) => {
        const hdrs = AdminHeaderSchema.parse(req.headers);
        const admin = process.env.ADMIN_TOKEN ?? '';
        const presented = hdrs['x-admin-token'] || hdrs.authorization?.replace(/^Bearer\s+/i, '');
        if (!admin || presented !== admin) return reply.unauthorized('Admin token required');
      },
    },
    async (req, reply) => {
      const { sessionId, amountUsd, reason } = req.body;
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent'],
      });
      if (!session || !session.payment_intent) return reply.badRequest('Invalid session');

      const pi = session.payment_intent as Stripe.PaymentIntent;
      await stripe.refunds.create({
        payment_intent: pi.id,
        amount: amountUsd ? Math.round(amountUsd * 100) : undefined,
        reason,
      });

      const itemId = session.metadata?.itemId;
      if (itemId) {
        const [row] = await db
          .update(poolItemsTable)
          .set({ status: 'refunded' })
          .where(eq(poolItemsTable.id, itemId))
          .returning();

        if (row?.poolId) {
          await emitPoolEvent({
            poolId: row.poolId,
            type: 'status_changed',
            payload: { itemId: row.id, itemStatus: 'refunded' },
          });
          await emitPoolEvent({
            poolId: row.poolId,
            type: 'payment_refunded',
            payload: { itemId: row.id, amountUsd: amountUsd ?? (pi.amount_received ?? 0) / 100 },
          });
        }
      }

      return reply.send({ ok: true });
    }
  );

  app.get<{ Params: { sessionId: string } }>(
    '/receipt/:sessionId.pdf',
    { schema: { params: z.object({ sessionId: z.string().min(10) }) } },
    async (req, reply) => {
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      if (!session || session.payment_status !== 'paid') return reply.notFound('No paid session');

      const buf = await renderReceiptPdf(session);
      reply
        .header('content-type', 'application/pdf')
        .header('content-disposition', `inline; filename="receipt_${session.id}.pdf"`)
        .send(buf);
    }
  );
}
