ALTER TABLE "recipe" ADD COLUMN "source_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_user_id_source_key_unique" ON "recipe" USING btree ("user_id","source_key");