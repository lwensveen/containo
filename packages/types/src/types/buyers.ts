import { z } from 'zod/v4';
import {
  BuyerIdParamSchema,
  BuyerShipmentSchema,
  BuyerShipmentsResponseSchema,
} from '../schemas/buyers.js';

export type BuyerIdParams = z.infer<typeof BuyerIdParamSchema>;
export type BuyerShipment = z.infer<typeof BuyerShipmentSchema>;
export type BuyerShipmentsResponse = z.infer<typeof BuyerShipmentsResponseSchema>;
