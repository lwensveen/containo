import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod/v4';
import { createSellerBatch, listSellerBatches } from './services.js';
import { BatchResponseSchema, CreateBatchSchema } from '@containo/types';

const getBatchesQuerySchema = z.object({ sellerId: z.string().uuid().optional() });

const sellerBatchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: z.infer<typeof CreateBatchSchema>;
    Reply: z.infer<typeof BatchResponseSchema>;
  }>(
    '/seller/batches',
    {
      preHandler: fastify.requireApiKey(['seller.batches:write']),
      schema: {
        body: CreateBatchSchema,
        response: { 201: BatchResponseSchema },
      },
    },
    async (request, reply) => {
      const dbRow = await createSellerBatch(request.body);
      const payload = BatchResponseSchema.parse(dbRow);
      return reply.code(201).send(payload);
    }
  );

  fastify.get<{
    Querystring: z.infer<typeof getBatchesQuerySchema>;
    Reply: z.infer<typeof BatchResponseSchema>[];
  }>(
    '/seller/batches',
    {
      preHandler: fastify.requireApiKey(['seller.batches:read']),
      schema: {
        querystring: getBatchesQuerySchema,
        response: { 200: z.array(BatchResponseSchema) },
      },
    },
    async (request, reply) => {
      const { sellerId } = request.query;
      const rows = await listSellerBatches(sellerId);
      const payload = z.array(BatchResponseSchema).parse(rows);
      return reply.send(payload);
    }
  );
};

export default sellerBatchRoutes;
