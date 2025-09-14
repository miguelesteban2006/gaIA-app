// server/index.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const app = express();
const server = http.createServer(app);

/* =========================
   Config básica
   ========================= */
app.set('trust proxy', 1); // necesario en Render si usas cookies detrás de proxy
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

/* =========================
   CORS (Pages + previews + localhost)
   ========================= */
const allowedOrigins = [
  'https://gaia-app.pages.dev',
  'http://localhost:5173'
];

function isAllowedOrigin(origin?: string) {
  if (!origin) return true; // permite curl/Postman/healthz
  try {
    const h = new URL(origin).hostname;
    return (
      h === 'gaia-app.pages.dev' ||
      h.endsWith('.gaia-app.pages.dev') ||
      h === 'localhost'
    );
  } catch {
    return false;
  }
}

const corsConfig: cors.CorsOptions = {
  origin(origin, cb) {
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed by CORS'));
  },
  credentials: true, // déjalo en true si usas cookies de sesión
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsConfig));
app.options('*', cors(corsConfig));

/* =========================
   Healthcheck
   ========================= */
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

/* =========================
   Postgres (Neon)
   ========================= */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL no definido');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // TLS para Neon/Render
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
ensureSchema().catch((e) => {
  console.error('Error ensureSchema:', e);
  process.exit(1);
});

/* =========================
   Helpers
   ========================= */
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase();
}

// acepta name / fullName / username / nombre
function pickName(body: any) {
  return body?.name ?? body?.fullName ?? body?.username ?? body?.nombre ?? '';
}

// acepta password / pass / contrasena / contraseña
function pickPassword(body: any) {
  return body?.password ?? body?.pass ?? body?.contrasena ?? body?.contraseña ?? '';
}

/* =========================
   (Opcional) Log seguro de payloads AUTH (quitar en prod si no lo quieres)
   ========================= */
// app.use((req, _res, next) => {
//   if (req.path === '/api/register' || req.path === '/api/login') {
//     const safe: any = { ...req.body };
//     if (safe.password) safe.password = '***';
//     if (safe.pass) safe.pass = '***';
//     console.log(`[DEBUG] ${req.method} ${req.path}`, safe);
//   }
//   next();
// });

/* =========================
   AUTH: Register
   ========================= */
app.post('/api/register', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email || '');
    const password = String(pickPassword(req.body) || '');
    // name opcional: si no viene, usa lo anterior a la @
    const rawName = String(pickName(req.body) || '').trim();
    const name = rawName || (email.includes('@') ? email.split('@')[0] : '');

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'FIELDS_REQUIRED' });
    }

    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
    if (exists.rowCount && exists.rowCount > 0) {
      return res.status(409).json({ ok: false, error: 'USER_EXISTS' });
    }

    const hash = await bcrypt.hash(password, 10);
    const inserted = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name || 'Usuario', email, hash]
    );
    const user = inserted.rows[0];

    // Cookie JWT (cross-site requiere SameSite=None + Secure)
    const token = jwt.sign({ sub: String(user.id), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,     // obligatorio en HTTPS
      sameSite: 'none', // obligatorio para Pages → Render
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    return res.status(201).json({ ok: true, user });
  } catch (e: any) {
    console.error('POST /api/register error', e?.message || e);
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

/* =========================
   AUTH: Login
   ========================= */
app.post('/api/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email || '');
    const password = String(pickPassword(req.body) || '');

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'EMAIL_PASSWORD_REQUIRED' });
    }

    const found = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    if (found.rowCount === 0) {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    const user = found.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    const token = jwt.sign({ sub: String(user.id), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    return res.status(200).json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e: any) {
    console.error('POST /api/login error', e?.message || e);
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

/* =========================
   Arranque
   ========================= */
const PORT = parseInt(process.env.PORT ?? '5000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
