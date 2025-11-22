CREATE TABLE "app_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "diagram_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"diagram_id" text NOT NULL,
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diagrams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text,
	"direct_url" text NOT NULL,
	"file_id" text NOT NULL,
	"make" text,
	"model" text,
	"year" text,
	"system" text,
	"tags" text,
	"notes" text,
	"status" text DEFAULT 'partial',
	"search_text" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"uploaded_by" text,
	CONSTRAINT "diagrams_file_id_unique" UNIQUE("file_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"plan" text,
	"stripe_payment_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'tecnico' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"last_access" timestamp,
	"created_at" timestamp DEFAULT now(),
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_plan" text DEFAULT 'free' NOT NULL,
	"subscription_status" text DEFAULT 'active',
	"searches_used" integer DEFAULT 0 NOT NULL,
	"searches_limit" integer DEFAULT 3 NOT NULL,
	"searches_reset_at" timestamp DEFAULT now(),
	"team_owner_id" text,
	"is_team_member" integer DEFAULT 0 NOT NULL,
	"password_reset_token" text,
	"password_reset_expires" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
