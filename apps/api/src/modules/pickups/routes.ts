import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import { createPickup } from './services/create-pickup.js';
import { listPickups } from './services/list-pickups.js';
import { updatePickupStatus } from './services/update-pickup-status.js';
import {
  PickupCreateSchema,
  PickupIdParamSchema,
  PickupListQuerySchema,
  PickupListResponseSchema,
  PickupRecordSchema,
  PickupStatusUpdateSchema,
} from '@containo/types/dist/schemas/pickups.js';
import { schedulePickup } from './services/schedule-pickup.js';

const AdminHeaderSchema = z.object({
  authorization: z.string().optional(),
  'x-admin-token': z.string().optional(),
});

function requireAdmin(h: any) {
  const hdrs = AdminHeaderSchema.parse(h);
  const admin = process.env.ADMIN_TOKEN ?? '';
  const presented = hdrs['x-admin-token'] || hdrs.authorization?.replace(/^Bearer\s+/i, '');
  return admin && presented === admin;
}

export default function pickupsRoutes(app: FastifyInstance) {
  app.post<{ Body: z.infer<typeof PickupCreateSchema>; Reply: z.infer<typeof PickupRecordSchema> }>(
    '/',
    {
      preHandler: app.requireApiKey(['pickups:write']),
      schema: { body: PickupCreateSchema, response: { 201: PickupRecordSchema } },
    },
    async (req, reply) => {
      const row = await createPickup(req.body);
      return reply.code(201).send(row);
    }
  );

  app.get<{
    Querystring: z.infer<typeof PickupListQuerySchema>;
    Reply: z.infer<typeof PickupListResponseSchema>;
  }>(
    '/',
    { schema: { querystring: PickupListQuerySchema, response: { 200: PickupListResponseSchema } } },
    async (req) => {
      const rows = await listPickups(req.query);
      return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        contactName: r.contactName,
        address1: r.address1,
        city: r.city,
        postcode: r.postcode,
        country: r.country,
        windowStartISO: r.windowStartISO,
        windowEndISO: r.windowEndISO,
        pieces: r.pieces,
        totalWeightKg: r.totalWeightKg,
        status: r.status,
        carrierRef: r.carrierRef ?? null,
        labelUrl: r.labelUrl ?? null,
        createdAt: r.createdAt!,
      }));
    }
  );

  app.get<{
    Params: z.infer<typeof PickupIdParamSchema>;
    Reply: z.infer<typeof PickupRecordSchema>;
  }>(
    '/:id',
    { schema: { params: PickupIdParamSchema, response: { 200: PickupRecordSchema } } },
    async (req, reply) => {
      const rows = await listPickups({}); // lazy; could write dedicated getById
      const found = rows.find((r) => r.id === req.params.id);
      if (!found) return reply.notFound('Not found');
      return found as any;
    }
  );

  app.patch<{
    Params: z.infer<typeof PickupIdParamSchema>;
    Body: z.infer<typeof PickupStatusUpdateSchema>;
    Reply: z.infer<typeof PickupRecordSchema>;
  }>(
    '/:id/status',
    {
      schema: {
        params: PickupIdParamSchema,
        body: PickupStatusUpdateSchema,
        response: { 200: PickupRecordSchema },
      },
      preHandler: async (req, reply) => {
        if (!requireAdmin(req.headers)) return reply.unauthorized('Admin token required');
      },
    },
    async (req, reply) => {
      const row = await updatePickupStatus(req.params.id, req.body);
      if (!row) return reply.notFound('Not found');
      return row;
    }
  );

  app.post<{
    Params: z.infer<typeof PickupIdParamSchema>;
    Reply: z.infer<typeof PickupRecordSchema>;
  }>(
    '/:id/schedule',
    {
      schema: {
        params: PickupIdParamSchema,
        response: { 200: PickupRecordSchema },
      },
      preHandler: async (req, reply) => {
        const AdminHeaderSchema = z.object({
          authorization: z.string().optional(),
          'x-admin-token': z.string().optional(),
        });
        const hdrs = AdminHeaderSchema.parse(req.headers);
        const admin = process.env.ADMIN_TOKEN ?? '';
        const presented = hdrs['x-admin-token'] || hdrs.authorization?.replace(/^Bearer\s+/i, '');
        if (!admin || presented !== admin) return reply.unauthorized('Admin token required');
      },
    },
    async (req, reply) => {
      const row = await schedulePickup(req.params.id);
      return reply.send(row);
    }
  );
}
