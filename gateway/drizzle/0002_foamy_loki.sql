ALTER TABLE "projects" ADD COLUMN "content_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_private" boolean DEFAULT true NOT NULL;