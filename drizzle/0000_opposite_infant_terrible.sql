CREATE TYPE "public"."mark_status" AS ENUM('free', 'maybe', 'busy');--> statement-breakpoint
CREATE TABLE "band_members" (
	"band_id" text NOT NULL,
	"person_id" text NOT NULL,
	CONSTRAINT "band_members_band_id_person_id_pk" PRIMARY KEY("band_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "bands" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gigs" (
	"id" text PRIMARY KEY NOT NULL,
	"band_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"venue" text,
	"address" text,
	"url" text,
	"note" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marks" (
	"person_id" text NOT NULL,
	"date" date NOT NULL,
	"status" "mark_status" NOT NULL,
	"note" text,
	CONSTRAINT "marks_person_id_date_pk" PRIMARY KEY("person_id","date")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_created_by_people_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marks" ADD CONSTRAINT "marks_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gigs_date_idx" ON "gigs" USING btree ("date");