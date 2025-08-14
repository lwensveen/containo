import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import {
  BuyerIdParamSchema,
  BuyerShipmentsQuerySchema,
  BuyerShipmentsResponseSchema,
} from '@containo/types';
import { listShipmentsByUser } from './services/list-shipments-by-user.js';

export function buyersRoutes(app: FastifyInstance) {
  app.get<{
    Params: z.infer<typeof BuyerIdParamSchema>;
    Querystring: z.infer<typeof BuyerShipmentsQuerySchema>;
    Reply: z.infer<typeof BuyerShipmentsResponseSchema>;
  }>(
    '/:userId/shipments',
    {
      schema: {
        params: BuyerIdParamSchema,
        querystring: BuyerShipmentsQuerySchema,
        response: { 200: BuyerShipmentsResponseSchema },
      },
    },
    async (req) => {
      const limit = req.query.limit ?? 100;
      return listShipmentsByUser(req.params.userId, limit);
    }
  );
}

export default buyersRoutes;
