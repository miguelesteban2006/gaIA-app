var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";
import { createServer } from "http";
import dotenv from "dotenv";

// server/routes.ts
import express from "express";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  elderlyUsers: () => elderlyUsers,
  healthAlerts: () => healthAlerts,
  insertElderlyUserSchema: () => insertElderlyUserSchema,
  insertHealthAlertSchema: () => insertHealthAlertSchema,
  insertInteractionSchema: () => insertInteractionSchema,
  insertUserElderlyRelationSchema: () => insertUserElderlyRelationSchema,
  insertUserSchema: () => insertUserSchema,
  interactions: () => interactions,
  loginUserSchema: () => loginUserSchema,
  sessions: () => sessions,
  userElderlyRelations: () => userElderlyRelations,
  users: () => users
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  real,
  integer
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default("family"),
  // "family", "doctor", "caregiver"
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var elderlyUsers = pgTable("elderly_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  medicalConditions: text("medical_conditions"),
  emergencyContact: varchar("emergency_contact"),
  robotId: varchar("robot_id").unique(),
  // ID del robot asignado
  isActive: varchar("is_active").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userElderlyRelations = pgTable("user_elderly_relations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  elderlyUserId: varchar("elderly_user_id").notNull().references(() => elderlyUsers.id),
  relationshipType: varchar("relationship_type").notNull(),
  // "son", "daughter", "doctor", "caregiver"
  permissions: text("permissions").notNull().default("view"),
  // "view", "edit", "admin"
  createdAt: timestamp("created_at").defaultNow()
});
var interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  elderlyUserId: varchar("elderly_user_id").notNull().references(() => elderlyUsers.id),
  interactionType: varchar("interaction_type").notNull(),
  // 'conversation', 'health_check', 'reminder', 'game'
  audioUrl: text("audio_url"),
  transcription: text("transcription"),
  sentimentScore: real("sentiment_score"),
  sentimentLabel: varchar("sentiment_label"),
  // 'positive', 'neutral', 'negative', 'concerning'
  moodScore: integer("mood_score"),
  // 1-10 scale
  cognitiveScore: real("cognitive_score"),
  // Cognitive assessment score
  healthIndicators: text("health_indicators"),
  // JSON with vital signs, etc.
  alertLevel: varchar("alert_level").default("normal"),
  // 'normal', 'attention', 'urgent'
  duration: integer("duration").notNull(),
  // in seconds
  robotResponse: text("robot_response"),
  // What the robot said/did
  notes: text("notes"),
  // Additional observations
  createdAt: timestamp("created_at").defaultNow()
});
var healthAlerts = pgTable("health_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  elderlyUserId: varchar("elderly_user_id").notNull().references(() => elderlyUsers.id),
  alertType: varchar("alert_type").notNull(),
  // 'health', 'safety', 'mood', 'cognitive'
  severity: varchar("severity").notNull(),
  // 'low', 'medium', 'high', 'critical'
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  isResolved: varchar("is_resolved").default("false"),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var loginUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true
});
var insertElderlyUserSchema = createInsertSchema(elderlyUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  dateOfBirth: z.string().optional().transform((val) => val ? new Date(val) : null)
});
var insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true
});
var insertHealthAlertSchema = createInsertSchema(healthAlerts).omit({
  id: true,
  createdAt: true
});
var insertUserElderlyRelationSchema = createInsertSchema(userElderlyRelations).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, sql as sql2, inArray } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async upsertUser(userData) {
    const existingUser = await this.getUser(userData.id);
    if (existingUser) {
      const [user] = await db.update(users).set(userData).where(eq(users.id, userData.id)).returning();
      return user;
    } else {
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    }
  }
  // Elderly user operations
  async getElderlyUser(id) {
    const [elderlyUser] = await db.select().from(elderlyUsers).where(eq(elderlyUsers.id, id));
    return elderlyUser;
  }
  async createElderlyUser(elderlyUserData) {
    const [elderlyUser] = await db.insert(elderlyUsers).values(elderlyUserData).returning();
    return elderlyUser;
  }
  async getUserElderlyUsers(userId) {
    const relations = await db.select({ elderlyUserId: userElderlyRelations.elderlyUserId }).from(userElderlyRelations).where(eq(userElderlyRelations.userId, userId));
    if (relations.length === 0) return [];
    return await db.select().from(elderlyUsers).where(inArray(elderlyUsers.id, relations.map((r) => r.elderlyUserId)));
  }
  // Interaction operations
  async createInteraction(interaction) {
    const [newInteraction] = await db.insert(interactions).values(interaction).returning();
    return newInteraction;
  }
  async getElderlyUserInteractions(elderlyUserId, limit = 10) {
    return await db.select().from(interactions).where(eq(interactions.elderlyUserId, elderlyUserId)).orderBy(desc(interactions.createdAt)).limit(limit);
  }
  async getElderlyUserStats(elderlyUserId) {
    const [stats] = await db.select({
      totalInteractions: sql2`count(*)::int`,
      avgMoodScore: sql2`coalesce(avg(${interactions.moodScore}), 0)::real`,
      avgSentiment: sql2`coalesce(avg(${interactions.sentimentScore}), 0)::real`,
      totalDuration: sql2`coalesce(sum(${interactions.duration}), 0)::int`
    }).from(interactions).where(eq(interactions.elderlyUserId, elderlyUserId));
    const [alertsStats] = await db.select({
      alertsCount: sql2`count(*)::int`
    }).from(healthAlerts).where(and(
      eq(healthAlerts.elderlyUserId, elderlyUserId),
      eq(healthAlerts.isResolved, "false")
    ));
    return {
      totalInteractions: stats?.totalInteractions || 0,
      avgMoodScore: stats?.avgMoodScore || 0,
      avgSentiment: stats?.avgSentiment || 0,
      totalDuration: stats?.totalDuration || 0,
      alertsCount: alertsStats?.alertsCount || 0
    };
  }
  async getSentimentData(elderlyUserId, days = 30) {
    const result = await db.select({
      date: sql2`date(${interactions.createdAt})`,
      sentiment: sql2`coalesce(avg(${interactions.sentimentScore}), 0)::real`,
      mood: sql2`coalesce(avg(${interactions.moodScore}), 0)::real`
    }).from(interactions).where(
      and(
        eq(interactions.elderlyUserId, elderlyUserId),
        sql2`${interactions.createdAt} >= current_date - interval '${sql2.raw(days.toString())} days'`
      )
    ).groupBy(sql2`date(${interactions.createdAt})`).orderBy(sql2`date(${interactions.createdAt})`);
    return result;
  }
  // Health alerts operations
  async createHealthAlert(alertData) {
    const [alert] = await db.insert(healthAlerts).values(alertData).returning();
    return alert;
  }
  async getElderlyUserAlerts(elderlyUserId, resolved) {
    const conditions = [eq(healthAlerts.elderlyUserId, elderlyUserId)];
    if (resolved !== void 0) {
      conditions.push(eq(healthAlerts.isResolved, resolved ? "true" : "false"));
    }
    return await db.select().from(healthAlerts).where(and(...conditions)).orderBy(desc(healthAlerts.createdAt));
  }
  async resolveAlert(alertId, resolvedBy) {
    await db.update(healthAlerts).set({
      isResolved: "true",
      resolvedBy,
      resolvedAt: /* @__PURE__ */ new Date()
    }).where(eq(healthAlerts.id, alertId));
  }
  // Relations operations
  async createUserElderlyRelation(relationData) {
    const [relation] = await db.insert(userElderlyRelations).values(relationData).returning();
    return relation;
  }
  async getUserElderlyRelations(userId) {
    return await db.select().from(userElderlyRelations).where(eq(userElderlyRelations.userId, userId));
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "gaia-jwt-secret-key-2025";
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
var authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  try {
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Authentication error" });
  }
};

// server/routes.ts
import path from "path";
import fs from "fs";
function registerRoutes(app2) {
  app2.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "El email ya est\xE1 registrado" });
      }
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      const token = generateToken(user.id);
      const { password: _, ...userResponse } = user;
      res.status(201).json({ token, user: userResponse });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
    }
  });
  app2.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciales inv\xE1lidas" });
      }
      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenciales inv\xE1lidas" });
      }
      const token = generateToken(user.id);
      const { password: _, ...userResponse } = user;
      res.json({ token, user: userResponse });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
    }
  });
  app2.get("/api/profile", authenticateToken, async (req, res) => {
    try {
      const { password: _, ...userResponse } = req.user;
      res.json(userResponse);
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app2.get("/api/auth/user", authenticateToken, async (req, res) => {
    try {
      const { password: _, ...userResponse } = req.user;
      res.json(userResponse);
    } catch (error) {
      console.error("Auth user error:", error);
      res.status(401).json({ message: "No autenticado" });
    }
  });
  app2.post("/api/elderly-users", authenticateToken, async (req, res) => {
    try {
      const elderlyUserData = insertElderlyUserSchema.parse(req.body);
      const elderlyUser = await storage.createElderlyUser(elderlyUserData);
      await storage.createUserElderlyRelation({
        userId: req.user.id,
        elderlyUserId: elderlyUser.id,
        relationshipType: "caregiver",
        permissions: "admin"
      });
      res.status(201).json(elderlyUser);
    } catch (error) {
      console.error("Create elderly user error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
    }
  });
  app2.get("/api/elderly-users", authenticateToken, async (req, res) => {
    try {
      const elderlyUsers2 = await storage.getUserElderlyUsers(req.user.id);
      res.json(elderlyUsers2);
    } catch (error) {
      console.error("Get elderly users error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app2.post("/api/interactions", authenticateToken, async (req, res) => {
    try {
      const interactionData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(interactionData);
      res.status(201).json(interaction);
    } catch (error) {
      console.error("Create interaction error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
    }
  });
  app2.get("/api/interactions/:elderlyUserId", authenticateToken, async (req, res) => {
    try {
      const { elderlyUserId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const interactions2 = await storage.getElderlyUserInteractions(elderlyUserId, limit);
      res.json(interactions2);
    } catch (error) {
      console.error("Get interactions error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app2.get("/api/stats/:elderlyUserId", authenticateToken, async (req, res) => {
    try {
      const { elderlyUserId } = req.params;
      const stats = await storage.getElderlyUserStats(elderlyUserId);
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app2.get("/api/sentiment-data/:elderlyUserId", authenticateToken, async (req, res) => {
    try {
      const { elderlyUserId } = req.params;
      const days = parseInt(req.query.days) || 30;
      const sentimentData = await storage.getSentimentData(elderlyUserId, days);
      res.json(sentimentData);
    } catch (error) {
      console.error("Get sentiment data error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app2.post("/api/health-alerts", authenticateToken, async (req, res) => {
    try {
      const alertData = insertHealthAlertSchema.parse(req.body);
      const alert = await storage.createHealthAlert(alertData);
      res.status(201).json(alert);
    } catch (error) {
      console.error("Create health alert error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
    }
  });
  app2.get("/api/health-alerts/:elderlyUserId", authenticateToken, async (req, res) => {
    try {
      const { elderlyUserId } = req.params;
      const resolved = req.query.resolved === "true" ? true : void 0;
      const alerts = await storage.getElderlyUserAlerts(elderlyUserId, resolved);
      res.json(alerts);
    } catch (error) {
      console.error("Get health alerts error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app2.put("/api/health-alerts/:alertId/resolve", authenticateToken, async (req, res) => {
    try {
      const { alertId } = req.params;
      await storage.resolveAlert(alertId, req.user.id);
      res.json({ message: "Alerta resuelta correctamente" });
    } catch (error) {
      console.error("Resolve alert error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  const uploadPath = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  app2.use("/uploads", express.static(uploadPath));
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server2) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server: server2 },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/index.ts
dotenv.config();
var app = express3();
var server = createServer(app);
app.use(express3.json({ limit: "10mb" }));
app.use(express3.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});
registerRoutes(app);
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    return;
  } else {
    await setupVite(app, server);
    const PORT = parseInt(process.env.PORT || "5000", 10);
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
      log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  }
}
if (process.env.NODE_ENV !== "production") {
  startServer().catch(console.error);
}
var index_default = app;
export {
  index_default as default
};
