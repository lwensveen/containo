import { z } from 'zod';

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

export type InboundDeclare = z.infer<typeof InboundDeclareSchema>;

export const InboundReceiveSchema = z.object({
  inboundId: z.string().uuid().optional(),
  hubCode: z.string().optional(),
  extTracking: z.string().optional(),
  lengthCm: z.number().int().positive().optional(),
  widthCm: z.number().int().positive().optional(),
  heightCm: z.number().int().positive().optional(),
  weightKg: z.number().positive().optional(),
  photoUrl: z.string().url().optional(),
  receivedAt: z.string().datetime().optional(),
  freeDays: z.number().int().min(0).max(30).optional(),
});

export type InboundReceive = z.infer<typeof InboundReceiveSchema>;
