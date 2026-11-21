CREATE TABLE "recipe_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"visibility" text DEFAULT 'private' NOT NULL,
	"share_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_list_share_id_unique" UNIQUE("share_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_list_item" (
	"list_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"added_by" text,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_list_item_list_id_recipe_id_pk" PRIMARY KEY("list_id","recipe_id")
);
--> statement-breakpoint
ALTER TABLE "recipe_list" ADD CONSTRAINT "recipe_list_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_list_item" ADD CONSTRAINT "recipe_list_item_list_id_recipe_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."recipe_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_list_item" ADD CONSTRAINT "recipe_list_item_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_list_item" ADD CONSTRAINT "recipe_list_item_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipe_list_owner_id_idx" ON "recipe_list" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_list_owner_name_unique" ON "recipe_list" USING btree ("owner_id",lower("name"));--> statement-breakpoint
CREATE INDEX "recipe_list_item_recipe_id_idx" ON "recipe_list_item" USING btree ("recipe_id");