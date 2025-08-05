import {
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { createTimestampColumn } from "./utils";
import { sql } from "./client";

export const modeEnum = pgEnum("mode_enum", ["sea", "air"]);
export const poolStatusEnum = pgEnum("pool_status_enum", [
  "open",
  "closing",
  "booked",
  "in_transit",
  "arrived",
]);
export const itemStatusEnum = pgEnum("item_status_enum", [
  "pending",
  "pooled",
  "pay_pending",
  "paid",
  "shipped",
  "delivered",
]);

export const pools = pgTable(
  "pools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    originPort: text("origin_port").notNull(),
    destPort: text("dest_port").notNull(),
    mode: modeEnum("mode").notNull(),
    cutoffISO: text("cutoff_iso").notNull(),
    capacityM3: numeric("capacity_m3").notNull(),
    usedM3: numeric("used_m3").notNull().default("0"),
    status: poolStatusEnum("status").notNull().default("open"),
    createdAt: createTimestampColumn("created_at"),
    updatedAt: createTimestampColumn("updated_at", true),
  },
  (table) => ({
    openLaneIdx: index("idx_pools_open_lane")
      .on(table.originPort, table.destPort, table.mode, table.cutoffISO)
      .where(sql`status = 'open'`),
  }),
);

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  poolId: uuid("pool_id").references(() => pools.id),
  originPort: text("origin_port").notNull(),
  destPort: text("dest_port").notNull(),
  mode: modeEnum("mode").notNull(),
  cutoffISO: text("cutoff_iso").notNull(),
  weightKg: numeric("weight_kg").notNull(),
  volumeM3: numeric("volume_m3").notNull(),
  length: numeric("l_cm").notNull(),
  width: numeric("w_cm").notNull(),
  height: numeric("h_cm").notNull(),
  status: itemStatusEnum("status").notNull().default("pending"),
  createdAt: createTimestampColumn("created_at"),
  updatedAt: createTimestampColumn("updated_at", true),
});
