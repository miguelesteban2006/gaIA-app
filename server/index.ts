// server/index.ts
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";

// Si en tu proyecto tienes un helper de logs, úsalo; si no, usa console.log
const log = (...args: any[]) => console.log("[server]", ...args);

dotenv.config();

const app = express();
const server = createServer(app);

/* ==========================
   Ajustes base
========================== */
app.disable("x-powered-by");
app.set("trust proxy", true);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

/* ==========================
   CORS (sin redirecciones en preflight)
   - Define ALLOWED_ORIGINS en tu entorno de producción:
     ALLOWED_ORIGINS=https://gaia-app.pages.dev,https://tu-dominio.com
   - En desarrollo, si no defines ALLOWED_ORIGINS, se permite todo.
========================== */
const parseAllowed = (v?: string) =>
  (v || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

const ALLOWED_ORIGINS = parseAllowed(process.env.ALLOWED_ORIGINS);

function setCorsHeaders(req: Request, res: Response) {
  const origin = req.headers.origin;

  if (process.env.NODE_ENV === "production") {
    // En producción, solo los orígenes explícitos
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  } else {
    // En desarrollo, permite cualquier origen (útil para pruebas locales)
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Origin, X-Requested-With"
  );
  // Cachea la preflight 1h
  res.setHeader("Access-Control-Max-Age", "3600");
}

app.use((req: Request, res: Response, next: NextFunction) => {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") {
    // Responder aquí evita cualquier redirect del stack
    return res.status(204).end();
  }
  next();
});

/* ==========================
   Rutas de salud
========================== */
app.get("/healthz", (_req, res) => {
  res.status(200).json({
    status: "ok",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({ ok: true, message: "GaIA API" });
});

/* ==========================
   Rutas de la API
========================== */
registerRoutes(app);

/* ==========================
   Manejadores de errores
========================== */
// 404 para lo que no exista
app.use((_req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Errores generales
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err?.statusCode || err?.status || 500;
  res.status(status).json({
    message: err?.message || "Internal Server Error",
  });
});

/* ==========================
   Arranque del servidor
========================== */
async function startServer() {
  const PORT = parseInt(process.env.PORT || "5000", 10);
  const HOST = process.env.HOST || "0.0.0.0";

  // Log de conexión DB solo informativo (no se conecta aquí)
  log(`Environment: ${process.env.NODE_ENV || "development"}`);
  log(`Allowed origins: ${ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(", ") : "(any in dev)"}`);

  server.listen(PORT, HOST, () => {
    log(`API Server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Fatal server error:", e);
  process.exit(1);
});
