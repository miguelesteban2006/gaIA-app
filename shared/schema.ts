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
  gender: varchar("gender"), // "male", "female", "other"
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  
  // Estado de salud y antecedentes médicos
  healthStatus: text("health_status"), // Estado general de salud
  medicalHistory: text("medical_history"), // Antecedentes médicos generales
  medicalConditions: text("medical_conditions"), // Mantener compatibilidad
  
  // Diagnósticos relevantes (JSON array)
  diagnoses: jsonb("diagnoses").$type<string[]>(),
  
  // Medicaciones actuales (JSON array de objetos)
  medications: jsonb("medications").$type<{
    name: string;
    dose: string;
    schedule: string;
    notes?: string;
  }[]>(),
  
  // Alergias y sensibilidades (JSON arrays)
  allergies: jsonb("allergies").$type<string[]>(),
  sensitivities: jsonb("sensitivities").$type<string[]>(),
  
  // Movilidad y ayudas técnicas
  mobilityStatus: varchar("mobility_status"), // "independent", "limited", "assisted", "wheelchair"
  mobilityAids: jsonb("mobility_aids").$type<string[]>(), // andador, bastón, silla de ruedas, etc.
  
  // Limitaciones sensoriales
  visionStatus: varchar("vision_status"), // "normal", "corrected", "limited", "blind"
  hearingStatus: varchar("hearing_status"), // "normal", "corrected", "limited", "deaf"
  speechStatus: varchar("speech_status"), // "normal", "limited", "non_verbal"
  
  // Información de contacto y cuidado
  emergencyContact: varchar("emergency_contact"),
  careInstructions: text("care_instructions"),
  
  // Sistema de robot (mantener compatibilidad)
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

// Schema para medicación individual
export const medicationSchema = z.object({
  name: z.string().min(1, "Nombre de medicación requerido"),
  dose: z.string().min(1, "Dosis requerida"),
  schedule: z.string().min(1, "Horario requerido"),
  notes: z.string().optional(),
});

// Schema completo para elderly users con validaciones detalladas
export const insertElderlyUserSchema = createInsertSchema(elderlyUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema para actualizar elderly users
export const updateElderlyUserSchema = insertElderlyUserSchema.partial();

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
export type InsertUser = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  phoneNumber?: string | null;
};
export type LoginUser = {
  email: string;
  password: string;
};
export type ElderlyUser = typeof elderlyUsers.$inferSelect;
export type InsertElderlyUser = {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | null;
  medicalConditions?: string | null;
  emergencyContact?: string | null;
  robotId?: string | null;
  isActive?: string | null;
};
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = {
  elderlyUserId: string;
  interactionType: string;
  audioUrl?: string | null;
  transcription?: string | null;
  sentimentScore?: number | null;
  sentimentLabel?: string | null;
  moodScore?: number | null;
  cognitiveScore?: number | null;
  healthIndicators?: string | null;
  alertLevel?: string | null;
  duration: number;
  robotResponse?: string | null;
  notes?: string | null;
};
export type HealthAlert = typeof healthAlerts.$inferSelect;
export type InsertHealthAlert = {
  elderlyUserId: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  isResolved?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
};
export type UserElderlyRelation = typeof userElderlyRelations.$inferSelect;
export type InsertUserElderlyRelation = {
  userId: string;
  elderlyUserId: string;
  relationshipType: string;
  permissions?: string;
};
