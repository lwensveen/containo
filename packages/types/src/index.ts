import { z } from "zod";

export const Mode = z.enum(["sea", "air"]);
export type Mode = z.infer<typeof Mode>;

export const Lane = z.object({
  originPort: z.string(),
  destPort: z.string(),
  mode: Mode,
  cutoffISO: z.string().datetime().or(z.string()), // loosen for now
});
export type Lane = z.infer<typeof Lane>;

export const Item = z.object({
  id: z.string(),
  userId: z.string(),
  lane: Lane,
  weightKg: z.number().positive(),
  volumeM3: z.number().positive(),
  dimsCm: z.object({ l: z.number(), w: z.number(), h: z.number() }),
  status: z.enum([
    "pending",
    "pooled",
    "pay_pending",
    "paid",
    "shipped",
    "delivered",
  ]),
});
export type Item = z.infer<typeof Item>;

export const Pool = z.object({
  id: z.string(),
  lane: Lane,
  capacityM3: z.number().positive(),
  usedM3: z.number().min(0),
  itemIds: z.array(z.string()),
  status: z.enum(["open", "closing", "booked", "in_transit", "arrived"]),
});
export type Pool = z.infer<typeof Pool>;
