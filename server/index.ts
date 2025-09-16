// server/index.ts
import "dotenv/config";
import express from "express";
import cors, { CorsOptionsDelegate } from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

const app = express();
app.set("trust proxy", true);

// ---------- CORS (Cloudflare Pages + localhost) ----------
const staticOrigins = [
  process.env.CORS_ORIGIN?.trim(),
  "https://gaia-app.pages.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean) as string[];

const corsOptions: CorsOptionsDelegate = (req, cb) => {
  const origin = req.header("Origin");
  const allowRegex = /\.pages\.dev$/i;
  if (!origin) return cb(null, { origin: true, credentials: true });

  const allowed =
    staticOrigins.includes(origin) || allowRegex.test(origin);
  cb(
    null,
    {
      origin: allowed,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["Content-Type"],
      maxAge: 86400,
    }
  );
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ---------- DB (Neon / Postgres) ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ---------- Helpers ----------
type JwtUser = { id: string; email: string };
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_TTL = "7d";

function signToken(user: JwtUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const header = req.header("Authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: "NO_TOKEN" });
    const payload = jwt.verify(token, JWT_SECRET) as JwtUser;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "INVALID_TOKEN" });
  }
}

function toArray<T>(v: any): T[] | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v as T[]) : [v as T];
}

// ---------- Health ----------
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      ok: true,
      env: {
        node: process.version,
        database_url: !!process.env.DATABASE_URL,
        cors_origin: staticOrigins,
      },
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "DB_ERROR" });
  }
});

// ---------- Auth: REGISTER ----------
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = "family" } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "FIELDS_REQUIRED" });
    }
    // email exists?
    const { rows: exists } = await pool.query(
      `SELECT id FROM users WHERE email = LOWER($1) LIMIT 1`,
      [email]
    );
    if (exists.length) {
      return res.status(409).json({ ok: false, error: "USER_EXISTS" });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES (LOWER($1), $2, $3, $4, $5)
       RETURNING id, email, first_name as "firstName", last_name as "lastName", role`,
      [email, hash, firstName || null, lastName || null, role]
    );
    const user = rows[0];
    const token = signToken({ id: user.id, email: user.email });
    return res.json({ ok: true, token, user });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
});

// ---------- Auth: LOGIN ----------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "FIELDS_REQUIRED" });
    }
    const { rows } = await pool.query(
      `SELECT id, email, password_hash, first_name as "firstName", last_name as "lastName", role
       FROM users WHERE email = LOWER($1) LIMIT 1`,
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
    }
    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
    }
    const token = signToken({ id: u.id, email: u.email });
    delete (u as any).password_hash;
    return res.json({ ok: true, token, user: u });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
});

// ---------- Auth: CURRENT USER ----------
app.get("/api/auth/user", authMiddleware, async (req, res) => {
  const user = (req as any).user as JwtUser;
  try {
    const { rows } = await pool.query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", role
       FROM users WHERE id = $1 LIMIT 1`,
      [user.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });
    return res.json({ ok: true, user: rows[0] });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
});
// alias por compatibilidad con el front
app.get("/api/auth/me", authMiddleware, (req, res) => {
  return app._router.handle(req, res, () => {}, "GET", "/api/auth/user");
});

// ---------- Elderly Users (lista y detalle) ----------
/**
 * Estructura tabla sugerida (ajusta a tu schema real):
 *  id UUID PK, owner_id UUID FK users(id), first_name text, last_name text,
 *  age int, gender text, photo_url text,
 *  diagnoses text[], allergies text[], sensitivities text[], mobility_aids text[],
 *  medications jsonb, emergency_contact jsonb, health_info jsonb,
 *  created_at timestamptz default now()
 */

app.get("/api/elderly-users", authMiddleware, async (req, res) => {
  const user = (req as any).user as JwtUser;
  const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 100);
  try {
    const { rows } = await pool.query(
      `SELECT id, owner_id as "ownerId", first_name as "firstName", last_name as "lastName",
              age, gender, photo_url as "photoUrl",
              diagnoses, allergies, sensitivities, mobility_aids as "mobilityAids",
              medications, emergency_contact as "emergencyContact", health_info as "healthInfo"
       FROM elderly_users
       WHERE owner_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [user.id, limit]
    );
    return res.json({ ok: true, data: rows });
  } catch (e: any) {
    // Si la tabla no existe, evita romper el flujo del front
    if (String(e?.message || "").includes("relation") && String(e?.message || "").includes("does not exist")) {
      return res.json({ ok: true, data: [] });
    }
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
});

app.get("/api/elderly-users/:id", authMiddleware, async (req, res) => {
  const user = (req as any).user as JwtUser;
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, owner_id as "ownerId", first_name as "firstName", last_name as "lastName",
              age, gender, photo_url as "photoUrl",
              diagnoses, allergies, sensitivities, mobility_aids as "mobilityAids",
              medications, emergency_contact as "emergencyContact", health_info as "healthInfo"
       FROM elderly_users
       WHERE id = $1 AND owner_id = $2
       LIMIT 1`,
      [id, user.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    return res.json(rows[0]);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
});

app.put("/api/elderly-users/:id", authMiddleware, async (req, res) => {
  const user = (req as any).user as JwtUser;
  const { id } = req.params;
  const body = req.body || {};
  // Construir UPDATE dinámico seguro
  const fieldsMap: Record<string, string> = {
    firstName: "first_name",
    lastName: "last_name",
    age: "age",
    gender: "gender",
    photoUrl: "photo_url",
    diagnoses: "diagnoses",
    allergies: "allergies",
    sensitivities: "sensitivities",
    mobilityAids: "mobility_aids",
    medications: "medications",
    emergencyContact: "emergency_contact",
    healthInfo: "health_info",
  };

  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  Object.entries(fieldsMap).forEach(([k, dbk]) => {
    if (k in body) {
      sets.push(`${dbk} = $${idx++}`);
      values.push(body[k]);
    }
  });

  if (!sets.length) {
    return res.json({ ok: true, updated: 0 });
  }

  values.push(id);
  values.push(user.id);

  try {
    const { rowCount } = await pool.query(
      `UPDATE elderly_users
       SET ${sets.join(", ")}
       WHERE id = $${idx++} AND owner_id = $${idx}
      `,
      values
    );
    return res.json({ ok: true, updated: rowCount || 0 });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
});

// ---------- Aliases por compatibilidad (no 404) ----------
app.get("/api/elderly/:id", (req, res, next) => {
  req.url = `/api/elderly-users/${req.params.id}`;
  next();
});
app.get("/api/patients", (req, res, next) => {
  req.url = `/api/elderly-users${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;
  next();
});
app.get("/api/residents", (req, res, next) => {
  req.url = `/api/elderly-users${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;
  next();
});
app.get("/api/seniors", (req, res, next) => {
  req.url = `/api/elderly-users${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;
  next();
});

// ---------- 404 API ----------
app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "NOT_FOUND" });
});

// ---------- Start ----------
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`[gaIA-api] listening on port ${PORT}`);
});
