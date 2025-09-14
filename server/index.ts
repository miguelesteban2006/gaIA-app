// server/index.ts  (ESM + TypeScript)

// --- Imports ESM ---
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- App / Server ---
const app = express();
const server = createServer(app);

// Render está detrás de proxy (necesario para cookies Secure)
app.set('trust proxy', 1);

// --- Middlewares base ---
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// --- CORS (Pages + previews + localhost) ---
const allowedOrigins = [
  'https://gaia-app.pages.dev',
  'http://localhost:5173'
];
function isAllowedOrigin(origin?: string) {
  if (!origin) return true; // curl/Postman/healthz
  try {
    const h = new URL(origin).hostname;
    return h === 'gaia-app.pages.dev' || h.endsWith('.gaia-app.pages.dev') || h === 'localhost';
  } catch {
    return false;
  }
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
app.options('*', cors(corsConfig)); // preflight global

// --- Salud ---
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// --- DB (Neon/Postgres) ---
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL no definido');
  process.exit(1);
}
const pool = new Pool({
  connectionString,                // recomienda: ?sslmode=require en la URL
  ssl: { rejectUnauthorized: false }
});
pool.on('error', (e) => console.error('Pool error:', e));

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
(async () => {
  try {
    await dbSanity();
    await ensureSchema();
  } catch (e: any) {
    console.error('[DB] Startup error:', e?.message || e);
    process.exit(1);
  }
})();

// --- Helpers / Auth ---
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const signToken = (payload: object) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

const normalizeEmail = (email: string) => (email || '').trim().toLowerCase();
// name / fullName / username / nombre
const pickName = (b: any) => (b?.name ?? b?.fullName ?? b?.username ?? b?.nombre ?? '') as string;
// password / pass / contrasena / contraseña
const pickPassword = (b: any) => (b?.password ?? b?.pass ?? b?.contrasena ?? b?.contraseña ?? '') as string;

// --- Debug DB (puedes quitarlo en prod) ---
app.get('/debug/db', async (_req, res) => {
  try {
    const r = await pool.query('select now() as now, current_user as "user"');
    res.json({ ok: true, db: r.rows[0] });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e), code: (e as any)?.code });
  }
});

// --- AUTH: Register ---
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

    const token = signToken({ sub: String(user.id), email: user.email });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,       // HTTPS
      sameSite: 'none',   // cross-site (Pages → Render)
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    return res.status(201).json({ ok: true, user });
  } catch (e: any) {
    const code = (e as any)?.code;
    if (code === '23505') return res.status(409).json({ ok: false, error: 'USER_EXISTS' }); // unique_violation
    if (code === '42P01') return res.status(500).json({ ok: false, error: 'TABLE_MISSING' });
    console.error('POST /api/register error', e);
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

    const token = signToken({ sub: String(user.id), email: user.email });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    return res.status(200).json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e: any) {
    const code = (e as any)?.code;
    if (code === '42P01') return res.status(500).json({ ok: false, error: 'TABLE_MISSING' });
    console.error('POST /api/login error', e);
    return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
  }
});

// --- AUTH middleware + /api/me ---
function auth(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.split(' ')[1];
  const token = (req as any).cookies?.token || bearer;
  if (!token) return res.status(401).json({ ok: false, error: 'NO_TOKEN' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
  }
}

app.get('/api/me', auth, async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user.sub;
  const db = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
  if (!db.rowCount) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
  res.json({ ok: true, user: db.rows[0] });
});

// --- Arranque ---
const PORT = parseInt(process.env.PORT ?? '5000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
