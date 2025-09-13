// server/index.ts
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { log, setupVite, serveStatic } from "./vite";

dotenv.config();

const app = express();
const server = createServer(app);

// 1) Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// 2) CORS + Preflight (OPTIONS) - Updated for better external compatibility
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Improved CORS handling for external deployments
  if (origin) {
    // Allow specific origins in production, all in development
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [origin] // Add your production domains here
      : [origin];
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  } else {
    // Fallback for same-origin requests
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// 3) Register API routes
registerRoutes(app);

// 4) Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

// 5) Start API server only (no static file serving)
async function startServer() {
  const PORT = parseInt(process.env.PORT || "5000", 10);
  const HOST = process.env.HOST || "0.0.0.0"; // Allow external connections
  
  server.listen(PORT, HOST, () => {
    log(`API Server running on ${HOST}:${PORT}`);
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    log(`Mode: API-only (frontend served independently)`);
  });
}

// Iniciar servidor
startServer().catch(console.error);

