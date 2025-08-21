import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  declareInbound,
  getHubCodeForUser,
  hubReceiveOrMeasure,
  listInboundByUser,
  requestPriorityShip,
} from './services.js';
import { InboundDeclareSchema, InboundReceiveSchema } from '@containo/types';
import { getHubConfig } from './hub-config.js';
import { db, inboundParcelsTable } from '@containo/db';
import { and, eq } from 'drizzle-orm';
import { renderInboundLabelPdf } from './services/render-label.js';

const HubKey = process.env.HUB_API_KEY ?? 'dev-hub-key';

export default async function inboundRoutes(app: FastifyInstance) {
  app.post('/declare', {
    schema: { body: InboundDeclareSchema as any },
    handler: async (req, reply) => {
      const row = await declareInbound(req.body as any);
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
}
