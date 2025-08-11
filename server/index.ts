// server/index.ts
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { log, setupVite, serveStatic } from "./vite";

dotenv.config();

const app = express();
const server = createServer(app);

// 1) Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// 2) CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin ?? "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "3600");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// 3) API
registerRoutes(app);

// 4) Errores
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ message: err.message || "Internal Server Error" });
});

// 5) Arranque
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    // 👉 sirve el frontend compilado (dist/public)
    serveStatic(app);
  } else {
    // 👉 dev con Vite middleware (HMR)
    await setupVite(app, server);
  }

  const PORT = parseInt(process.env.PORT || "3000", 10);
  const HOST = process.env.HOST || "0.0.0.0";
  server.listen(PORT, HOST, () => {
    log(`Server running on ${HOST}:${PORT}`);
    log(`Environment: ${process.env.NODE_ENV || "development"}`);
    log(`Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`);
  });
}

startServer().catch(console.error);
