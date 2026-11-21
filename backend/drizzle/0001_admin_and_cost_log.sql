CREATE TABLE "api_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"url" text,
	"total_usd" double precision NOT NULL,
	"complete" boolean NOT NULL,
	"items" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "api_request" ADD CONSTRAINT "api_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_request_created_at_idx" ON "api_request" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "api_request_user_id_idx" ON "api_request" USING btree ("user_id");