import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { z } from 'zod/v4';
import { db, poolItemsTable } from '@containo/db';
import { eq } from 'drizzle-orm';
import { emitPoolEvent } from '../events/services/emit-pool-event.js';
import { renderReceiptPdf } from './services/render-receipt.js';
import { recomputePoolFill } from '../pools/services/recompute-fill.js';
import { withIdempotency } from '../../lib/idempotency.js';

const AdminHeaderSchema = z.object({
  authorization: z.string().optional(),
  'x-admin-token': z.string().optional(),
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

const CheckoutBodySchema = z
  .object({
    itemId: z.uuid().optional(),
    inboundId: z.uuid().optional(),
    amountUsd: z.number().positive(),
    currency: z
      .string()
      .length(3)
      .transform((s) => s.toLowerCase()),
    description: z.string().max(200),
    successUrl: z.url().optional(),
    cancelUrl: z.url().optional(),
    idempotencyKey: z.string().min(8).optional(),
  })
  .refine((b) => !!b.itemId || !!b.inboundId, {
    message: 'Provide itemId or inboundId',
    path: ['itemId'],
  });

const CheckoutRespSchema = z.object({ url: z.string().url() });

const RefundBody = z.object({
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
      const {
        itemId,
        inboundId,
        amountUsd,
        currency,
        description,
        successUrl,
        cancelUrl,
        idempotencyKey,
      } = req.body;

      const idemHeader =
        (req.headers['idempotency-key'] as string | undefined) ||
        (req.headers['x-idempotency-key'] as string | undefined);
      const idemKey = idemHeader || idempotencyKey;

      if (itemId) {
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
      }

      const webBase =
        process.env.WEB_BASE_URL || process.env.PUBLIC_WEB_URL || 'http://localhost:3000';
      const success_url =
        successUrl || `${webBase}/(protected)/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = cancelUrl || `${webBase}/(protected)/checkout/cancel`;

      const run = async () => {
        const session = await stripe.checkout.sessions.create(
          {
            mode: 'payment',
            line_items: [
              {
                price_data: {
                  currency,
                  unit_amount: Math.round(amountUsd * 100),
                  product_data: {
                    name: description,
                  },
                },
                quantity: 1,
              },
            ],
            success_url,
            cancel_url,
            metadata: {
              itemId: itemId ?? '',
              inboundId: inboundId ?? '',
            },
          },
          idemKey ? { idempotencyKey: `checkout:${idemKey}` } : undefined
        );

        return { url: session.url!, sessionId: session.id };
      };

      try {
        const data = idemKey
          ? await withIdempotency(
              'payments.checkout',
              idemKey,
              {
                itemId,
                inboundId,
                amountUsd,
                currency,
                description,
                success_url,
                cancel_url,
              },
              run,
              {
                onReplay: async (cached) => {
                  const sid = (cached as any)?.sessionId as string | undefined;
                  if (!sid) return null;
                  const s = await stripe.checkout.sessions.retrieve(sid).catch(() => null);
                  if (s?.status === 'expired') {
                    const fresh = await run();
                    return fresh;
                  }
                  return null;
                },
              }
            )
          : await run();

        return reply.send({ url: data.url });
      } catch (err: any) {
        const code = err?.statusCode ?? 500;
        return reply.code(code).send({ error: String(err?.message ?? err) });
      }
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
        const inboundId = session.metadata?.inboundId;

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

              await recomputePoolFill(row.poolId);
            }
          }
        }

        // Inbound flow: metadata only for now (can be expanded later)
        if (inboundId) {
          req.log.info({ inboundId, sessionId: session.id }, 'inbound payment completed');
          // Optional future:
          // - Insert a payment record for inbound
          // - Emit an inbound event like 'priority_paid'
          // - Trigger DAP/DDP quotation flow, etc.
        }
      }

      if (event.type === 'checkout.session.expired') {
        // Optional: move item back from pay_pending to pooled/pending
        // (left as-is to avoid scope imports; you implemented this in your webhook module earlier)
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

          await recomputePoolFill(row.poolId);
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
