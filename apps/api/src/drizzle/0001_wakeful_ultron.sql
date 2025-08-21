CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"response" jsonb DEFAULT 'null'::jsonb,
	"locked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbound_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inbound_id" uuid NOT NULL,
	"type" "inbound_event_type" NOT NULL,
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbound_parcels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hub_code" text NOT NULL,
	"origin_port" varchar(3) NOT NULL,
	"dest_port" varchar(3) NOT NULL,
	"mode" "mode_enum" NOT NULL,
	"seller_name" text,
	"ext_tracking" text,
	"length_cm" integer,
	"width_cm" integer,
	"height_cm" integer,
	"weight_kg" numeric(10, 3),
	"status" "inbound_status" DEFAULT 'expected' NOT NULL,
	"received_at" timestamp with time zone,
	"free_until_at" timestamp with time zone,
	"photo_url" text,
	"notes" text,
	"pool_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_hub_codes" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"hub_code" text NOT NULL,
	"hub_location" text DEFAULT 'NL-AMS Hub' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "ux_pool_items_idempotency";--> statement-breakpoint
ALTER TABLE "inbound_events" ADD CONSTRAINT "inbound_events_inbound_id_inbound_parcels_id_fk" FOREIGN KEY ("inbound_id") REFERENCES "public"."inbound_parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_parcels" ADD CONSTRAINT "inbound_parcels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_parcels" ADD CONSTRAINT "inbound_parcels_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_hub_codes" ADD CONSTRAINT "user_hub_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_idem_scope_key" ON "idempotency_keys" USING btree ("scope","key");--> statement-breakpoint
CREATE INDEX "idx_idem_status_created" ON "idempotency_keys" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_inbound_events_inbound_created" ON "inbound_events" USING btree ("inbound_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inbound_user_created" ON "inbound_parcels" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inbound_status" ON "inbound_parcels" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_inbound_lane" ON "inbound_parcels" USING btree ("origin_port","dest_port","mode");--> statement-breakpoint
CREATE INDEX "idx_inbound_pool" ON "inbound_parcels" USING btree ("pool_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_user_hub_code" ON "user_hub_codes" USING btree ("hub_code");--> statement-breakpoint
ALTER TABLE "pool_items" DROP COLUMN "idempotency_key";