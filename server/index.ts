// server/index.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';

const app = express();
const server = http.createServer(app);

// Render está detrás de proxy (cookies cross-site)
app.set('trust proxy', 1);

// ===== CORS =====
const allowedOrigins = [
  'https://gaia-app.pages.dev',
  'http://localhost:5173'
];

// Acepta previews de Pages: <hash>.gaia-app.pages.dev
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

// ===== Middlewares =====
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ===== Healthcheck =====
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// ===== ENDPOINTS que necesita tu frontend =====
// Nota: son mínimos para quitar el 404. Sustituye con tu lógica real (BD, hash, JWT, etc.).

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'EMAIL_PASSWORD_REQUIRED' });
  }

  // TODO: valida credenciales en tu BD. Ejemplo si usas cookie de sesión:
  // const jwt = crearToken({ sub: user.id });
  // res.cookie('token', jwt, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7*24*60*60*1000 });

  // Respuesta mínima para que el cliente continúe
  return res.status(200).json({ ok: true /*, token: jwt si usas JWT en JSON */ });
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, error: 'FIELDS_REQUIRED' });
  }

  // TODO: crea el usuario en tu BD (valida duplicados, hashea password, etc.)
  return res.status(201).json({ ok: true });
});

// ===== Arranque =====
const PORT = parseInt(process.env.PORT ?? '5000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
