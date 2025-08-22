import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import {
  declareInbound,
  getHubCodeForUser,
  hubReceiveOrMeasure,
  listInboundByUser,
  requestPriorityShip,
} from './services.js';
import { InboundDeclareSchema, InboundReceiveSchema } from '@containo/types';
import { getHubConfig } from './hub-config.js';
import {
  db,
  inboundEventsTable,
  inboundParcelsTable,
  userHubCodesTable,
  usersTable,
} from '@containo/db';
import { and, desc, eq } from 'drizzle-orm';
import { renderInboundLabelPdf } from './services/render-label.js';
import { computePriceForInbound, getActiveLaneRate } from '../lanes/services/pricing.js';
import { withIdempotency } from '../../lib/idempotency.js';
import { emailSellerInstructions } from '../notifications/inbound-emails.js';

const HubKey = process.env.HUB_API_KEY ?? 'dev-hub-key';

export default async function inboundRoutes(app: FastifyInstance) {
  app.post('/declare', {
    schema: { body: InboundDeclareSchema as any },
    handler: async (req, reply) => {
      const body = InboundDeclareSchema.parse(req.body);
      const hdr =
        (req.headers['idempotency-key'] as string | undefined) ||
        (req.headers['x-idempotency-key'] as string | undefined);

      const run = async () => declareInbound(body);

      const row = hdr
        ? await withIdempotency(
            'inbound.declare',
            hdr,
            {
              userId: body.userId,
              originPort: body.originPort,
              destPort: body.destPort,
              mode: body.mode,
              extTracking: body.extTracking ?? '',
              sellerName: body.sellerName ?? '',
              notes: body.notes ?? '',
            },
            run
          )
        : await run();

      reply.send(row);
    },
  });

  app.get('/', {
    schema: {
      querystring: z.object({ userId: z.string().uuid() }) as any,
    },
    handler: async (req, reply) => {
      const { userId } = req.query as { userId: string };
      const rows = await listInboundByUser(userId);
      reply.send(rows);
    },
  });

  app.get('/hub-code', {
    schema: {
      querystring: z.object({ userId: z.string().uuid() }) as any,
    },
    handler: async (req, reply) => {
      const { userId } = req.query as { userId: string };
      const hub = await getHubCodeForUser(userId);
      reply.send(hub);
    },
  });

  app.post('/_hub/receive', {
    schema: { body: InboundReceiveSchema as any },
    preHandler: (req, reply, done) => {
      const key = req.headers['x-api-key'];
      if (key !== HubKey) return reply.code(401).send({ error: 'unauthorized' });
      done();
    },
    handler: async (req, reply) => {
      const row = await hubReceiveOrMeasure(req.body as any);
      reply.send(row);
    },
  });

  app.post('/:id/ship-now', {
    schema: {
      params: z.object({ id: z.string().uuid() }) as any,
      body: z.object({ userId: z.string().uuid() }).strict() as any,
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const { userId } = req.body as { userId: string };
      const row = await requestPriorityShip(id, userId);
      reply.send({ ok: true, inbound: row });
    },
  });

  app.get('/:id/label.pdf', {
    schema: { params: z.object({ id: z.string().uuid() }) as any },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };

      const inbound = await db.query.inboundParcelsTable.findFirst({
        where: eq(inboundParcelsTable.id, id),
        columns: {
          hubCode: true,
          sellerName: true,
          extTracking: true,
          lengthCm: true,
          widthCm: true,
          heightCm: true,
          weightKg: true,
        },
      });

      if (!inbound) {
        return reply.code(404).send({ error: 'inbound not found' });
      }

      const pdf = await renderInboundLabelPdf(
        {
          hubCode: inbound.hubCode!,
          sellerName: inbound.sellerName ?? null,
          extTracking: inbound.extTracking ?? null,
          lengthCm: inbound.lengthCm ?? null,
          widthCm: inbound.widthCm ?? null,
          heightCm: inbound.heightCm ?? null,
          weightKg: inbound.weightKg ?? null,
        },
        getHubConfig()
      );

      reply
        .header('Content-Type', 'application/pdf')
        .header(
          'Content-Disposition',
          `inline; filename="containo-inbound-label-${inbound.hubCode}.pdf"`
        )
        .send(pdf);
    },
  });

  app.get('/label.pdf', {
    schema: {
      querystring: z
        .object({
          hubCode: z.string().min(3),
          extTracking: z.string().min(1).optional(),
          sellerName: z.string().optional(),
        })
        .partial({ extTracking: true, sellerName: true }) as any,
    },
    handler: async (req, reply) => {
      const { hubCode, extTracking, sellerName } = req.query as {
        hubCode: string;
        extTracking?: string;
        sellerName?: string;
      };

      type LabelKnown = {
        hubCode: string;
        sellerName: string | null;
        extTracking: string | null;
        lengthCm: number | null;
        widthCm: number | null;
        heightCm: number | null;
        weightKg: string | null;
      };

      let known: LabelKnown | null = null;

      if (extTracking) {
        const found = await db.query.inboundParcelsTable.findFirst({
          where: and(
            eq(inboundParcelsTable.hubCode, hubCode.toUpperCase()),
            eq(inboundParcelsTable.extTracking, extTracking)
          ),
          columns: {
            hubCode: true,
            sellerName: true,
            extTracking: true,
            lengthCm: true,
            widthCm: true,
            heightCm: true,
            weightKg: true,
          },
        });

        if (found) known = found;
      }

      const pdf = await renderInboundLabelPdf(
        known ?? {
          hubCode: hubCode.toUpperCase(),
          sellerName: sellerName ?? null,
          extTracking: extTracking ?? null,
          lengthCm: null,
          widthCm: null,
          heightCm: null,
          weightKg: null,
        },
        getHubConfig()
      );

      reply
        .header('Content-Type', 'application/pdf')
        .header(
          'Content-Disposition',
          `inline; filename="containo-inbound-label-${hubCode.toUpperCase()}.pdf"`
        )
        .send(pdf);
    },
  });

  app.post('/:id/price', {
    schema: {
      params: z.object({ id: z.string().uuid() }) as any,
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };

      const inbound = await db.query.inboundParcelsTable.findFirst({
        where: eq(inboundParcelsTable.id, id),
        columns: {
          id: true,
          originPort: true,
          destPort: true,
          mode: true,
          lengthCm: true,
          widthCm: true,
          heightCm: true,
          weightKg: true,
          status: true,
        },
      });

      if (!inbound) {
        return reply.code(404).send({ error: 'not_found' });
      }

      if (!inbound.originPort || !inbound.destPort || !inbound.mode) {
        return reply.code(400).send({ error: 'lane_missing' });
      }

      const lengthCm = inbound.lengthCm ?? null;
      const widthCm = inbound.widthCm ?? null;
      const heightCm = inbound.heightCm ?? null;
      const weightKg = inbound.weightKg != null ? Number(inbound.weightKg) : null;

      const haveDims = lengthCm != null && widthCm != null && heightCm != null && weightKg != null;

      if (!haveDims) {
        return reply.code(400).send({ error: 'not_measured' });
      }

      const rate = await getActiveLaneRate(
        {
          originPort: inbound.originPort,
          destPort: inbound.destPort,
          mode: inbound.mode as 'air' | 'sea',
        },
        new Date()
      );
      if (!rate) {
        return reply.code(400).send({ error: 'no_rate' });
      }

      const { amountUsd, breakdown } = computePriceForInbound(
        {
          originPort: inbound.originPort,
          destPort: inbound.destPort,
          mode: inbound.mode as 'air' | 'sea',
        },
        { lengthCm, widthCm, heightCm, weightKg },
        rate
      );

      reply.send({
        inboundId: inbound.id,
        currency: 'USD',
        amountUsd,
        breakdown,
      });
    },
  });

  app.get('/events', {
    schema: {
      querystring: z.object({
        userId: z.string().uuid(),
        limit: z.number().int().min(1).max(1000).optional(),
      }) as any,
    },
    handler: async (req, reply) => {
      const { userId, limit = 500 } = req.query as { userId: string; limit?: number };

      const rows = await db
        .select({
          id: inboundEventsTable.id,
          inboundId: inboundEventsTable.inboundId,
          type: inboundEventsTable.type,
          createdAt: inboundEventsTable.createdAt,
        })
        .from(inboundEventsTable)
        .innerJoin(inboundParcelsTable, eq(inboundParcelsTable.id, inboundEventsTable.inboundId))
        .where(eq(inboundParcelsTable.userId, userId))
        .orderBy(desc(inboundEventsTable.createdAt))
        .limit(limit);

      reply.send(rows);
    },
  });

  app.post('/email-seller-instructions', {
    schema: { body: z.object({ userId: z.string().uuid() }) as any },
    handler: async (req, reply) => {
      const { userId } = req.body as { userId: string };
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      const [hc] = await db
        .select()
        .from(userHubCodesTable)
        .where(eq(userHubCodesTable.userId, userId))
        .limit(1);

      if (!u?.email || !hc?.hubCode) return reply.badRequest('Missing email or hub code');

      const labelUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/inbound/label.pdf?hubCode=${encodeURIComponent(hc.hubCode)}`;

      await emailSellerInstructions({
        to: u.email,
        buyerName: (u as any).name ?? null,
        hubCode: hc.hubCode,
        hubLocation: hc.hubLocation ?? null,
        labelUrl,
      });

      reply.send({ ok: true });
    },
  });
}
