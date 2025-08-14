import { z } from 'zod/v4';
import {
  CustomsDocCreateSchema,
  CustomsDocInsertSchema,
  CustomsDocLineInsertSchema,
  CustomsDocLineSelectCoercedSchema,
  CustomsDocLineSelectSchema,
  CustomsDocLineUpdateSchema,
  CustomsDocRecordSchema,
  CustomsDocSelectCoercedSchema,
  CustomsDocSelectSchema,
  CustomsDocUpdateSchema,
  CustomsLineInputSchema,
} from '../schemas/customs.js';

export type CustomsDoc = z.infer<typeof CustomsDocSelectSchema>;
export type CustomsDocCoerced = z.infer<typeof CustomsDocSelectCoercedSchema>;
export type CustomsDocLine = z.infer<typeof CustomsDocLineSelectSchema>;
export type CustomsDocLineCoerced = z.infer<typeof CustomsDocLineSelectCoercedSchema>;

export type CustomsDocInsert = z.infer<typeof CustomsDocInsertSchema>;
export type CustomsDocUpdate = z.infer<typeof CustomsDocUpdateSchema>;
export type CustomsDocLineInsert = z.infer<typeof CustomsDocLineInsertSchema>;
export type CustomsDocLineUpdate = z.infer<typeof CustomsDocLineUpdateSchema>;

export type CustomsDocCreate = z.infer<typeof CustomsDocCreateSchema>;
export type CustomsLineInput = z.infer<typeof CustomsLineInputSchema>;

export type CustomsDocRecord = z.infer<typeof CustomsDocRecordSchema>;
