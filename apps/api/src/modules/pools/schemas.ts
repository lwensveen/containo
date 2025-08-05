import { z } from 'zod/v4';

export const DimsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const QuoteInputSchema = z.object({
  mode: z.enum(['sea', 'air']),
  weightKg: z.number().positive(),
  dimsCm: DimsSchema,
});

export const QuoteSchema = z.object({
  userPrice: z.number(),
  costBasis: z.number(),
  serviceFee: z.number(),
  margin: z.number(),
  volumeM3: z.number(),
  billableKg: z.number(),
  breakdown: z.record(z.string(), z.number()),
});

export const IntentInputSchema = QuoteInputSchema.extend({
  userId: z.string().min(1),
  originPort: z.string().min(1),
  destPort: z.string().min(1),
  cutoffISO: z.string().min(1), // tighten later to datetime if desired
});

export const IntentResponseSchema = z.object({
  id: z.uuid(),
  accepted: z.literal(true),
  volumeM3: z.number(),
});

export type QuoteInput = z.infer<typeof QuoteInputSchema>;
export type IntentInput = z.infer<typeof IntentInputSchema>;
