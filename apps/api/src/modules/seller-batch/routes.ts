import { FastifyPluginAsync } from 'fastify';
import { batchResponseSchema, createBatchSchema } from '@containo/types';
import { createSellerBatch, listSellerBatches } from './services.js';
import { z } from 'zod/v4';

const getBatchesQuerySchema = z.object({ sellerId: z.uuid().optional() });

const sellerBatchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: z.infer<typeof createBatchSchema>;
    Reply: z.infer<typeof batchResponseSchema>;
  }>(
    '/seller/batches',
    {
      schema: {
        body: createBatchSchema,
        response: { 201: batchResponseSchema },
      },
    },
    async (request, reply) => {
      const data = await createSellerBatch(request.body);
      return reply.code(201).send(data);
    }
  );

  fastify.get<{
    Querystring: z.infer<typeof getBatchesQuerySchema>;
    Reply: z.infer<typeof batchResponseSchema>[];
  }>(
    '/seller/batches',
    {
      schema: {
        querystring: getBatchesQuerySchema,
        response: { 200: z.array(batchResponseSchema) },
      },
    },
    async (request, reply) => {
      const { sellerId } = request.query;
      const batches = await listSellerBatches(sellerId);
      return reply.send(batches);
    }
  );
};

export default sellerBatchRoutes;
