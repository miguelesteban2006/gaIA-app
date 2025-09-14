// server/index.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const server = http.createServer(app);

// --- Ajustes generales ---
app.set('trust proxy', 1);                 // necesario en Render si usas cookies
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// --- CORS (Pages + previews + localhost) ---
const allowedOrigins = [
  'https://gaia-app.pages.dev',
  'http://localhost:5173'
];
function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  try {
    const h = new URL(origin).hostname;
    return h === 'gaia-app.pages.dev' || h.endsWith('.gaia-app.pages.dev') || h === 'localhost';
  } catch { return false; }
}
const corsConfig: cors.CorsOptions = {
  origin(origin, cb) {
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));

// --- Healthcheck ---
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// --- Postgres (Neon) ---
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL no definido');
  process.exit(1);
}
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // Neon/Render en HTTPS
});

async function ensureSchema() {
  // Crea tabla sencilla de usuarios si no existe
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

// --- Helpers ---
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase();
}
function pickName(body: any) {
  return body?.name || body?.fullName || body?.username || '';
}
function pickPassword(body: any) {
  return body?.password || body?.pass || '';
}

// --- AUTH: Register ---
app.post('/api/register', async (req, res) => {
  try {
    const name = String(pickName(req.body) || '').trim();
    const email = normalizeEmail(req.body?.email || '');
    const password = String(pickPassword(req.body) || '');

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, error: 'FIELDS_REQUIRED' });
    }

    // ¿Ya existe?
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
    if (exists.rowCount && exists.rowCount > 0) {
      return res.status(409).json({ ok: false, error: 'USER_EXISTS' });
    }

    const hash = await bcrypt.hash(password, 10);
    const inserted = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, hash]
    );
    const user = inserted.rows[0];

    // Si quieres devolver cookie de sesión:
    const token = jwt.sign({ sub: String(user.id), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,       // obligatorio en HTTPS
      sameSite: 'none',   // obligatorio cross-site (Pages → Render)
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    return res.status(201).json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e: any) {
    console.error('POST /api/register error', e?.message || e);
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

// --- AUTH: Login ---
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

    // Emite cookie JWT
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

// --- Arranque ---
const PORT = parseInt(process.env.PORT ?? '5000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
