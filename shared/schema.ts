import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  real,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for GaIA caregivers/family
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default("family"), // "family", "doctor", "caregiver"
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Elderly users being monitored by GaIA robot
export const elderlyUsers = pgTable("elderly_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  medicalConditions: text("medical_conditions"),
  emergencyContact: varchar("emergency_contact"),
  robotId: varchar("robot_id").unique(), // ID del robot asignado
  isActive: varchar("is_active").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relationship between caregivers and elderly users
export const userElderlyRelations = pgTable("user_elderly_relations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  elderlyUserId: varchar("elderly_user_id").notNull().references(() => elderlyUsers.id),
  relationshipType: varchar("relationship_type").notNull(), // "son", "daughter", "doctor", "caregiver"
  permissions: text("permissions").notNull().default("view"), // "view", "edit", "admin"
  createdAt: timestamp("created_at").defaultNow(),
});

// Robot interactions with elderly users
export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  elderlyUserId: varchar("elderly_user_id").notNull().references(() => elderlyUsers.id),
  interactionType: varchar("interaction_type").notNull(), // 'conversation', 'health_check', 'reminder', 'game'
  audioUrl: text("audio_url"),
  transcription: text("transcription"),
  sentimentScore: real("sentiment_score"),
  sentimentLabel: varchar("sentiment_label"), // 'positive', 'neutral', 'negative', 'concerning'
  moodScore: integer("mood_score"), // 1-10 scale
  cognitiveScore: real("cognitive_score"), // Cognitive assessment score
  healthIndicators: text("health_indicators"), // JSON with vital signs, etc.
  alertLevel: varchar("alert_level").default("normal"), // 'normal', 'attention', 'urgent'
  duration: integer("duration").notNull(), // in seconds
  robotResponse: text("robot_response"), // What the robot said/did
  notes: text("notes"), // Additional observations
  createdAt: timestamp("created_at").defaultNow(),
});

// Health alerts and notifications
export const healthAlerts = pgTable("health_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  elderlyUserId: varchar("elderly_user_id").notNull().references(() => elderlyUsers.id),
  alertType: varchar("alert_type").notNull(), // 'health', 'safety', 'mood', 'cognitive'
  severity: varchar("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  isResolved: varchar("is_resolved").default("false"),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas and types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertElderlyUserSchema = createInsertSchema(elderlyUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.string().optional().transform((val) => val ? new Date(val) : null),
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
});

export const insertHealthAlertSchema = createInsertSchema(healthAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertUserElderlyRelationSchema = createInsertSchema(userElderlyRelations).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type ElderlyUser = typeof elderlyUsers.$inferSelect;
export type InsertElderlyUser = z.infer<typeof insertElderlyUserSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type HealthAlert = typeof healthAlerts.$inferSelect;
export type InsertHealthAlert = z.infer<typeof insertHealthAlertSchema>;
export type UserElderlyRelation = typeof userElderlyRelations.$inferSelect;
export type InsertUserElderlyRelation = z.infer<typeof insertUserElderlyRelationSchema>;
