import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod/v4';
import { createPickup, listPickups } from './services.js';
import {
  createPickupSchema,
  pickupResponseSchema,
} from '@containo/types/dist/warehouse-pickup/schemas.js';

const warehousePickupRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: z.infer<typeof createPickupSchema>;
    Reply: z.infer<typeof pickupResponseSchema>;
  }>(
    '/warehouse/pickups',
    {
      schema: {
        body: createPickupSchema,
        response: { 201: pickupResponseSchema },
      },
    },
    async (request, reply) => {
      const dbRow = await createPickup(request.body);
      const payload = pickupResponseSchema.parse(dbRow);
      return reply.code(201).send(payload);
    }
  );

  fastify.get<{
    Reply: z.infer<typeof pickupResponseSchema>[];
  }>(
    '/warehouse/pickups',
    {
      schema: {
        response: { 200: z.array(pickupResponseSchema) },
      },
    },
    async (_, reply) => {
      const all = await listPickups();
      const payload = z.array(pickupResponseSchema).parse(all);
      return reply.send(payload);
    }
  );
};

export default warehousePickupRoutes;
