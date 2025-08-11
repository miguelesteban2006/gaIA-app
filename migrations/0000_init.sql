CREATE TABLE "elderly_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"date_of_birth" timestamp,
	"gender" varchar,
	"phone_number" varchar,
	"address" text,
	"health_status" text,
	"medical_history" text,
	"medical_conditions" text,
	"diagnoses" jsonb,
	"medications" jsonb,
	"allergies" jsonb,
	"sensitivities" jsonb,
	"mobility_status" varchar,
	"mobility_aids" jsonb,
	"vision_status" varchar,
	"hearing_status" varchar,
	"speech_status" varchar,
	"emergency_contact" varchar,
	"care_instructions" text,
	"robot_id" varchar,
	"is_active" varchar DEFAULT 'true',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "elderly_users_robot_id_unique" UNIQUE("robot_id")
);
--> statement-breakpoint
CREATE TABLE "health_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"elderly_user_id" varchar NOT NULL,
	"alert_type" varchar NOT NULL,
	"severity" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"is_resolved" varchar DEFAULT 'false',
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"elderly_user_id" varchar NOT NULL,
	"interaction_type" varchar NOT NULL,
	"audio_url" text,
	"transcription" text,
	"sentiment_score" real,
	"sentiment_label" varchar,
	"mood_score" integer,
	"cognitive_score" real,
	"health_indicators" text,
	"alert_level" varchar DEFAULT 'normal',
	"duration" integer NOT NULL,
	"robot_response" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_elderly_relations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"elderly_user_id" varchar NOT NULL,
	"relationship_type" varchar NOT NULL,
	"permissions" text DEFAULT 'view' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"role" varchar DEFAULT 'family' NOT NULL,
	"phone_number" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "health_alerts" ADD CONSTRAINT "health_alerts_elderly_user_id_elderly_users_id_fk" FOREIGN KEY ("elderly_user_id") REFERENCES "public"."elderly_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_elderly_user_id_elderly_users_id_fk" FOREIGN KEY ("elderly_user_id") REFERENCES "public"."elderly_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_elderly_relations" ADD CONSTRAINT "user_elderly_relations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_elderly_relations" ADD CONSTRAINT "user_elderly_relations_elderly_user_id_elderly_users_id_fk" FOREIGN KEY ("elderly_user_id") REFERENCES "public"."elderly_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");