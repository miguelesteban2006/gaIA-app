// server/db.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Usa SSL en producción / Neon
const shouldUseSSL =
  process.env.DATABASE_SSL === "true" ||
  (process.env.NODE_ENV === "production") ||
  /neon\.tech/i.test(process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
