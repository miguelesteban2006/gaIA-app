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

// ----- CONFIG GENERAL -----
app.set('trust proxy', 1); // Render va detrás de proxy
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ----- CORS (Pages + previews + localhost) -----
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

// ----- HEALTH -----
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// ----- DB (Neon/Postgres) -----
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL no definido');
  process.exit(1);
}
// Recomendado: que tu DATABASE_URL lleve `?sslmode=require`
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
pool.on('error', (e) => {
  console.error('Pool error:', e);
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
  console.log('[DB] Schema OK');
}

async function dbSanity() {
  const r = await pool.query('select now() as now, current_user as "user"');
  console.log('[DB] Connected:', r.rows[0]);
}

// Arranca comprobando DB
(async () => {
  try {
    await dbSanity();
    await ensureSchema();
  } catch (e: any) {
    console.error('[DB] Startup error:', e?.message || e);
    process.exit(1);
  }
})();

// ----- HELPERS -----
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase();
}
// Alias para nombre
function pickName(body: any) {
  return body?.name ?? body?.fullName ?? body?.username ?? body?.nombre ?? '';
}
// Alias para password
function pickPassword(body: any) {
  return body?.password ?? body?.pass ?? body?.contrasena ?? body?.contraseña ?? '';
}

// ----- DEBUG (para ti; quita cuando termines) -----
app.get('/debug/db', async (_req, res) => {
  try {
    const r = await pool.query('select now() as now, current_user as "user"');
    res.json({ ok: true, db: r.rows[0] });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e), code: (e as any)?.code });
  }
});

// ----- AUTH: REGISTER -----
app.post('/api/register', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email || '');
    const password = String(pickPassword(req.body) || '');
    const rawName = String(pickName(req.body) || '').trim();
    const name = rawName || (email.includes('@') ? email.split('@')[0] : 'Usuario');

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
      [name, email, hash]
    );
    const user = inserted.rows[0];

    const token = jwt.sign({ sub: String(user.id), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    return res.status(201).json({ ok: true, user });
  } catch (e: any) {
    const code = (e as any)?.code;
    if (code === '23505') { // unique_violation
      return res.status(409).json({ ok: false, error: 'USER_EXISTS' });
    }
    if (code === '42P01') { // undefined_table
      return res.status(500).json({ ok: false, error: 'TABLE_MISSING' });
    }
    console.error('POST /api/register error', e);
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

// ----- AUTH: LOGIN -----
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
    const code = (e as any)?.code;
    if (code === '42P01') {
      return res.status(500).json({ ok: false, error: 'TABLE_MISSING' });
    }
    console.error('POST /api/login error', e);
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

// ----- ARRANQUE -----
const PORT = parseInt(process.env.PORT ?? '5000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
