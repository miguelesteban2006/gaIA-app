// server/index.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';

const app = express();
const server = http.createServer(app);

// IMPORTANTES EN RENDER (detrás de proxy) si usas cookies
app.set('trust proxy', 1);

// Dominios permitidos: producción (Pages) + local dev
const allowedOrigins = [
  'https://gaia-app.pages.dev',
  'http://localhost:5173'
];

// Permite también las URLs de preview de Pages: <hash>.gaia-app.pages.dev
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
  credentials: true, // deja true si usas cookies para sesión; si usas sólo JWT en header, podrías poner false
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// CORS debe ir ANTES de tus rutas
app.use(cors(corsConfig));
// Responder explícitamente a preflight en cualquier ruta
app.options('*', cors(corsConfig));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ----- Salud para pruebas/monitoreo -----
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// ----- TUS RUTAS API AQUÍ -----
// Ejemplo de patrón para login con cookie (ajusta a tu lógica):
/*
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  // ... valida credenciales, crea token ...
  const jwt = 'TOKEN_AQUI';

  // Cookie cross-site: obligatorio SameSite=None + Secure
  res.cookie('token', jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 7
  });

  return res.status(200).json({ ok: true });
});
*/

// Si en desarrollo quieres Vite middleware, hazlo SOLO fuera de producción.
// (Con Pages no necesitas Vite en el backend.)
if (process.env.NODE_ENV !== 'production') {
  console.log('[dev] Backend corriendo en modo desarrollo');
  // Aquí podrías montar Vite dev server si lo usabas, pero no es necesario.
}

const PORT = parseInt(process.env.PORT ?? '5000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
