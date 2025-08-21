import { z } from 'zod/v4';
import { InboundEventTypeSchema } from '../types/index.js';

export const InboundDeclareSchema = z.object({
  userId: z.string().uuid(),
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['air', 'sea']),
  sellerName: z.string().trim().optional(),
  extTracking: z.string().trim().optional(),
  lengthCm: z.number().int().positive().optional(),
  widthCm: z.number().int().positive().optional(),
  heightCm: z.number().int().positive().optional(),
  weightKg: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const InboundReceiveSchema = z
  .object({
    inboundId: z.string().uuid().optional(),
    hubCode: z.string().min(3).optional(),
    extTracking: z.string().min(1).optional(),
    lengthCm: z.number().int().positive().optional(),
    widthCm: z.number().int().positive().optional(),
    heightCm: z.number().int().positive().optional(),
    weightKg: z.number().positive().optional(),
    photoUrl: z.url().optional(),
    receivedAt: z.union([z.date(), z.date()]).optional(),
    freeDays: z.number().int().min(0).max(60).optional(),
    originPort: z.string().length(3).optional(),
    destPort: z.string().length(3).optional(),
    mode: z.enum(['sea', 'air']).optional(),
  })
  .refine(
    (v) => !!v.inboundId || (!!v.hubCode && !!v.extTracking),
    'Provide inboundId OR (hubCode + extTracking)'
  );

export const InboundEventSchema = z.object({
  id: z.uuid(),
  inboundId: z.uuid(),
  type: InboundEventTypeSchema,
  payload: z.record(z.string(), z.unknown()).default({} as Record<string, unknown>),
  createdAt: z.union([z.date(), z.date()]),
});
