import z from 'zod/v4';
import {
  IntentInputSchema,
  IntentResponseSchema,
  IntentSelectCoercedSchema,
  IntentSelectSchema,
} from '../schemas/intents.js';

export type Intent = z.infer<typeof IntentSelectSchema>;
export type IntentCoerced = z.infer<typeof IntentSelectCoercedSchema>;
export type IntentInput = z.infer<typeof IntentInputSchema>;
export type IntentResponse = z.infer<typeof IntentResponseSchema>;
