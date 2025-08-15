import Stripe from 'stripe';
import { z } from 'zod/v4';
import { db, paymentsTable, poolItemsTable } from '@containo/db';
import { eq } from 'drizzle-orm';
import { emitPoolEvent } from '../../events/services/emit-pool-event.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-07-30.basil' });
const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

export const CreateCheckoutInput = z.object({
  itemId: z.string().uuid(),
  amountUsd: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  description: z.string().optional(),
});

export async function createCheckoutSession(input: z.infer<typeof CreateCheckoutInput>) {
  const amountCents = Math.round(input.amountUsd * 100);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${SITE_URL}/dashboard?pay=success`,
    cancel_url: `${SITE_URL}/checkout?cancel=1`,
    line_items: [
      {
        price_data: {
          currency: input.currency,
          product_data: { name: input.description || 'Containo Pool Reservation' },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { itemId: input.itemId },
  });

  // persist payment row
  await db.insert(paymentsTable).values({
    itemId: input.itemId,
    stripeSessionId: session.id,
    amountCents,
    currency: input.currency.toUpperCase(),
    status: 'created',
  });

  return { url: session.url! };
}

export async function handleStripeWebhook(rawBody: Buffer, sig: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  const event = stripe.webhooks.constructEvent(rawBody, sig ?? '', secret);

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    const itemId = s.metadata?.itemId;
    if (itemId) {
      await db.transaction(async (tx) => {
        await tx
          .update(paymentsTable)
          .set({
            status: 'completed',
            stripePaymentIntentId:
              typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id,
          })
          .where(eq(paymentsTable.stripeSessionId, s.id));

        await tx
          .update(poolItemsTable)
          .set({ status: 'paid' })
          .where(eq(poolItemsTable.id, itemId));

        await emitPoolEvent({
          poolId:
            (
              await tx.select().from(poolItemsTable).where(eq(poolItemsTable.id, itemId)).limit(1)
            ).at(0)?.poolId ?? '',
          type: 'status_changed',
          payload: { itemId, status: 'paid' },
        });
      });
    }
  }

  if (
    event.type === 'checkout.session.expired' ||
    event.type === 'checkout.session.async_payment_failed'
  ) {
    const s = event.data.object as Stripe.Checkout.Session;
    await db
      .update(paymentsTable)
      .set({ status: 'failed' })
      .where(eq(paymentsTable.stripeSessionId, s.id));
  }

  return { ok: true };
}
