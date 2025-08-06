import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createPickup, listPickups } from './services.js';
import { CreatePickupSchema, PickupResponseSchema } from '@containo/types';

const warehousePickupRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: z.infer<typeof CreatePickupSchema>;
    Reply: z.infer<typeof PickupResponseSchema>;
  }>(
    '/warehouse/pickups',
    {
      schema: {
        body: CreatePickupSchema,
        response: { 201: PickupResponseSchema },
      },
    },
    async (request, reply) => {
      const dbRow = await createPickup(request.body);
      const payload = PickupResponseSchema.parse(dbRow);
      return reply.code(201).send(payload);
    }
  );

  fastify.get<{
    Reply: z.infer<typeof PickupResponseSchema>[];
  }>(
    '/warehouse/pickups',
    {
      schema: {
        response: { 200: z.array(PickupResponseSchema) },
      },
    },
    async (_, reply) => {
      const all = await listPickups();
      const payload = z.array(PickupResponseSchema).parse(all);
      return reply.send(payload);
    }
  );
};

export default warehousePickupRoutes;
