CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"scopes" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean DEFAULT false NOT NULL,
	"transports" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "passkey_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customs_doc_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doc_id" uuid NOT NULL,
	"item_id" uuid,
	"position" integer DEFAULT 1 NOT NULL,
	"description" text NOT NULL,
	"hs_code" varchar(10),
	"origin_country" varchar(2),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_gross_weight_kg" numeric,
	"unit_net_weight_kg" numeric,
	"unit_weight_kg" numeric(10, 3) DEFAULT '0' NOT NULL,
	"unit_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customs_docs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid NOT NULL,
	"doc_number" text,
	"exporter_name" text NOT NULL,
	"exporter_address" text NOT NULL,
	"importer_name" text NOT NULL,
	"importer_address" text NOT NULL,
	"incoterm" text DEFAULT 'EXW',
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"total_value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intents" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"idempotency_key" varchar(100),
	"origin_port" varchar(3) NOT NULL,
	"dest_port" varchar(3) NOT NULL,
	"mode" "mode_enum" NOT NULL,
	"cutoff_at" timestamp with time zone NOT NULL,
	"weight_kg" numeric(10, 3) NOT NULL,
	"dims_l_cm" integer NOT NULL,
	"dims_w_cm" integer NOT NULL,
	"dims_h_cm" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lane_rates" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"origin_port" varchar(3) NOT NULL,
	"dest_port" varchar(3) NOT NULL,
	"mode" "mode_enum" NOT NULL,
	"sea_price_per_cbm" numeric,
	"sea_min_price" numeric,
	"air_price_per_kg" numeric,
	"air_min_price" numeric,
	"service_fee_per_order" numeric DEFAULT '0',
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone DEFAULT now() NOT NULL,
	"priority" integer DEFAULT 0,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" varchar(32) DEFAULT 'created' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickup_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pickup_id" uuid NOT NULL,
	"type" "pickup_event_type" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_name" text NOT NULL,
	"company" text,
	"email" text,
	"phone" text,
	"address1" text NOT NULL,
	"address2" text,
	"city" text NOT NULL,
	"state" text,
	"postcode" text NOT NULL,
	"country" varchar(2) NOT NULL,
	"window_start_at" timestamp with time zone NOT NULL,
	"window_end_at" timestamp with time zone NOT NULL,
	"pieces" integer DEFAULT 1 NOT NULL,
	"total_weight_kg" numeric NOT NULL,
	"notes" text,
	"status" "pickup_status" DEFAULT 'requested' NOT NULL,
	"carrier_ref" text,
	"label_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid NOT NULL,
	"type" "pool_event_enum" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pool_id" uuid,
	"origin_port" varchar(3) NOT NULL,
	"dest_port" varchar(3) NOT NULL,
	"mode" "mode_enum" NOT NULL,
	"stripe_session_id" text,
	"idempotency_key" text,
	"cutoff_at" timestamp with time zone NOT NULL,
	"weight_kg" numeric NOT NULL,
	"volume_m3" numeric NOT NULL,
	"l_cm" numeric NOT NULL,
	"w_cm" numeric NOT NULL,
	"h_cm" numeric NOT NULL,
	"status" "item_status_enum" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origin_port" varchar(3) NOT NULL,
	"dest_port" varchar(3) NOT NULL,
	"mode" "mode_enum" NOT NULL,
	"cutoff_at" timestamp with time zone NOT NULL,
	"capacity_m3" numeric NOT NULL,
	"used_m3" numeric DEFAULT '0' NOT NULL,
	"status" "pool_status_enum" DEFAULT 'open' NOT NULL,
	"booking_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"username" text,
	"display_username" text,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "warehouse_pickups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"courier" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"schedule_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"event_type" "webhook_event_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp DEFAULT now(),
	"last_error" text,
	"response_status" integer,
	"status" "delivery_status_enum" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"events" text DEFAULT '*' NOT NULL,
	"secret" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_impersonated_by_users_id_fk" FOREIGN KEY ("impersonated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customs_doc_lines" ADD CONSTRAINT "customs_doc_lines_doc_id_customs_docs_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."customs_docs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customs_doc_lines" ADD CONSTRAINT "customs_doc_lines_item_id_pool_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."pool_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customs_docs" ADD CONSTRAINT "customs_docs_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intents" ADD CONSTRAINT "intents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_item_id_pool_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."pool_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_events" ADD CONSTRAINT "pickup_events_pickup_id_pickups_id_fk" FOREIGN KEY ("pickup_id") REFERENCES "public"."pickups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_events" ADD CONSTRAINT "pool_events_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_items" ADD CONSTRAINT "pool_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_items" ADD CONSTRAINT "pool_items_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_subscription_id_webhook_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."webhook_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_keys_owner" ON "api_keys" USING btree ("owner_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_api_keys_hash" ON "api_keys" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_customs_lines_by_doc" ON "customs_doc_lines" USING btree ("doc_id","position");--> statement-breakpoint
CREATE INDEX "idx_customs_lines_by_item" ON "customs_doc_lines" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_customs_line_doc_position" ON "customs_doc_lines" USING btree ("doc_id","position");--> statement-breakpoint
CREATE INDEX "idx_customs_docs_by_pool" ON "customs_docs" USING btree ("pool_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_customs_doc_pool_docnum" ON "customs_docs" USING btree ("pool_id","doc_number");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_intents_user_idem" ON "intents" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_intents_idem" ON "intents" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_intents_lane_cutoff" ON "intents" USING btree ("origin_port","dest_port","mode","cutoff_at");--> statement-breakpoint
CREATE INDEX "idx_lane_rates_lane_active" ON "lane_rates" USING btree ("origin_port","dest_port","mode","priority") WHERE "lane_rates"."active" = true;--> statement-breakpoint
CREATE INDEX "idx_lane_rates_effective_from" ON "lane_rates" USING btree ("effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_lane_mode_priority_from" ON "lane_rates" USING btree ("origin_port","dest_port","mode","priority","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_payments_stripe_session" ON "payments" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_payments_stripe_pi" ON "payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "idx_payments_item" ON "payments" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pickup_events_pickup_created" ON "pickup_events" USING btree ("pickup_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_pickup_events_type_created" ON "pickup_events" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "idx_pickups_user_created" ON "pickups" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_pickups_status" ON "pickups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pool_events_pool_created" ON "pool_events" USING btree ("pool_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_pool_events_type_created" ON "pool_events" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "idx_items_pending_lane" ON "pool_items" USING btree ("origin_port","dest_port","mode","cutoff_at") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "idx_items_by_pool" ON "pool_items" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "idx_items_user_created" ON "pool_items" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_pool_items_idempotency" ON "pool_items" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_pool_items_stripe_session" ON "pool_items" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "idx_pools_open_lane" ON "pools" USING btree ("origin_port","dest_port","mode","cutoff_at") WHERE status = 'open';--> statement-breakpoint
CREATE INDEX "idx_pools_status_cutoff" ON "pools" USING btree ("status","cutoff_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_pools_booking_ref" ON "pools" USING btree ("booking_ref");--> statement-breakpoint
CREATE INDEX "idx_seller_batches_seller_created" ON "seller_batches" USING btree ("seller_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_seller_batches_status" ON "seller_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_wh_pickups_status_schedule" ON "warehouse_pickups" USING btree ("status","schedule_at");--> statement-breakpoint
CREATE INDEX "idx_wh_pickups_courier_schedule" ON "warehouse_pickups" USING btree ("courier","schedule_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_pending" ON "webhook_deliveries" USING btree ("status","next_attempt_at","attempt_count");--> statement-breakpoint
CREATE INDEX "idx_webhooks_active" ON "webhook_subscriptions" USING btree ("is_active","created_at");