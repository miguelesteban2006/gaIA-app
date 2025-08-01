// server/routes.ts
import express, { type Express, type Request, type Response } from "express";
import { storage } from "./storage";
import {
  authenticateToken,
  hashPassword,
  comparePassword,
  generateToken,
  type AuthRequest,
} from "./auth";
import {
  insertUserSchema,
  loginUserSchema,
  insertElderlyUserSchema,
  insertInteractionSchema,
  insertHealthAlertSchema,
  insertUserElderlyRelationSchema,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

export function registerRoutes(app: Express) {
  // Registro de usuario
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Verificar si el usuario ya existe
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Hash de la contraseña
      const hashedPassword = await hashPassword(userData.password);
      
      // Crear el usuario
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generar token
      const token = generateToken(user.id);
      
      // Remover la contraseña del objeto de respuesta
      const { password: _, ...userResponse } = user;
      
      res.status(201).json({ token, user: userResponse });
    } catch (error) {
      console.error("Registration error:", error);
      res
        .status(500)
        .json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
    }
  });

  // Login de usuario
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      // Buscar usuario por email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Verificar contraseña
      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Generar token
      const token = generateToken(user.id);
      
      // Remover la contraseña del objeto de respuesta
      const { password: _, ...userResponse } = user;
      
      res.json({ token, user: userResponse });
    } catch (error) {
      console.error("Login error:", error);
      res
        .status(500)
        .json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
    }
  });

  // Obtener perfil del usuario autenticado
  app.get("/api/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { password: _, ...userResponse } = req.user;
      res.json(userResponse);
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Ruta de autenticación para el frontend
  app.get("/api/auth/user", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { password: _, ...userResponse } = req.user;
      res.json(userResponse);
    } catch (error) {
      console.error("Auth user error:", error);
      res.status(401).json({ message: "No autenticado" });
    }
  });

  // Rutas de usuarios mayores
  app.post("/api/elderly-users", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const elderlyUserData = insertElderlyUserSchema.parse(req.body);
      const elderlyUser = await storage.createElderlyUser(elderlyUserData);
      
      // Crear relación con el usuario que lo registra
      await storage.createUserElderlyRelation({
        userId: req.user.id,
        elderlyUserId: elderlyUser.id,
        relationshipType: "caregiver",
        permissions: "admin"
      });
      
      res.status(201).json(elderlyUser);
    } catch (error) {
      console.error("Create elderly user error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
    }
  });

  app.get("/api/elderly-users", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const elderlyUsers = await storage.getUserElderlyUsers(req.user.id);
      res.json(elderlyUsers);
    } catch (error) {
      console.error("Get elderly users error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Rutas de interacciones
  app.post("/api/interactions", authenticateToken, async (req: Request, res: Response) => {
    try {
      const interactionData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(interactionData);
      res.status(201).json(interaction);
    } catch (error) {
      console.error("Create interaction error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
    }
  });

  app.get("/api/interactions/:elderlyUserId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { elderlyUserId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const interactions = await storage.getElderlyUserInteractions(elderlyUserId, limit);
      res.json(interactions);
    } catch (error) {
      console.error("Get interactions error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Rutas de estadísticas
  app.get("/api/stats/:elderlyUserId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { elderlyUserId } = req.params;
      const stats = await storage.getElderlyUserStats(elderlyUserId);
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/sentiment-data/:elderlyUserId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { elderlyUserId } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      const sentimentData = await storage.getSentimentData(elderlyUserId, days);
      res.json(sentimentData);
    } catch (error) {
      console.error("Get sentiment data error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Rutas de alertas de salud
  app.post("/api/health-alerts", authenticateToken, async (req: Request, res: Response) => {
    try {
      const alertData = insertHealthAlertSchema.parse(req.body);
      const alert = await storage.createHealthAlert(alertData);
      res.status(201).json(alert);
    } catch (error) {
      console.error("Create health alert error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
    }
  });

  app.get("/api/health-alerts/:elderlyUserId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { elderlyUserId } = req.params;
      const resolved = req.query.resolved === 'true' ? true : undefined;
      const alerts = await storage.getElderlyUserAlerts(elderlyUserId, resolved);
      res.json(alerts);
    } catch (error) {
      console.error("Get health alerts error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/health-alerts/:alertId/resolve", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { alertId } = req.params;
      await storage.resolveAlert(alertId, req.user.id);
      res.json({ message: "Alerta resuelta correctamente" });
    } catch (error) {
      console.error("Resolve alert error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Servir uploads
  const uploadPath = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  app.use("/uploads", express.static(uploadPath));
}
