// server/vite.ts
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { fileURLToPath } from "url";

// __dirname para ESM (Node 18)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  viteLogger.info(`[${formattedTime}] [${source}] ${message}`);
}

/**
 * Configura Vite en modo desarrollo (middleware) o no-op en producción.
 * - Dev: monta Vite middleware para servir el frontend con HMR.
 * - Prod: no hace nada; usa serveStatic() para servir /dist/public.
 */
export async function setupVite(app: Express, _server: Server) {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    log("Running in production; Vite middleware is disabled", "vite");
    return;
  }

  log("Starting Vite in middleware mode (development)", "vite");

  const vite = await createViteServer({
    ...(typeof viteConfig === "function" ? await viteConfig({ command: "serve", mode: "development" }) : viteConfig),
    appType: "custom",
    server: {
      middlewareMode: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    root: path.resolve(__dirname, "../client"),
  });

  app.use(vite.middlewares);
}

/**
 * Sirve estáticos de producción (build Vite) y fallback a index.html (SPA).
 * Asegúrate de ejecutar primero `npm run build`.
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist/public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Run "npm run build" first.`,
    );
  }

  app.use(express.static(distPath));

  // Fallback SPA
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  log(`Serving static files from ${distPath}`, "vite");
}
