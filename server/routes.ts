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
  updateElderlyUserSchema,
  insertInteractionSchema,
  insertHealthAlertSchema,
  insertUserElderlyRelationSchema,
} from "@shared/schema";
// File upload functionality removed for Vercel compatibility
// Use cloud storage services like Cloudinary or AWS S3 for file uploads

export function registerRoutes(app: Express) {
  
  // Health check endpoint for PWA
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });
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
      const message = error instanceof Error ? error.message : "Error interno del servidor";
      res.status(500).json({ 
        message, 
        error: process.env.NODE_ENV === 'development' ? error : undefined 
      });
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
      const rawData = req.body;
      // Transform dateOfBirth string to Date if provided
      if (rawData.dateOfBirth) {
        rawData.dateOfBirth = new Date(rawData.dateOfBirth);
      }
      
      const elderlyUserData = insertElderlyUserSchema.parse(rawData);
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

  // Obtener un adulto mayor específico
  app.get("/api/elderly-users/:elderlyUserId", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { elderlyUserId } = req.params;
      const elderlyUser = await storage.getElderlyUser(elderlyUserId);
      
      if (!elderlyUser) {
        return res.status(404).json({ message: "Adulto mayor no encontrado" });
      }
      
      // Verificar que el usuario tiene permisos para ver este adulto mayor
      const relations = await storage.getUserElderlyUsers(req.user.id);
      const hasAccess = relations.some(relation => relation.id === elderlyUserId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "No tienes permisos para acceder a este perfil" });
      }
      
      res.json(elderlyUser);
    } catch (error) {
      console.error("Get elderly user error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Actualizar perfil de adulto mayor
  app.put("/api/elderly-users/:elderlyUserId", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { elderlyUserId } = req.params;
      
      // Verificar que el usuario tiene permisos para editar este adulto mayor
      const relations = await storage.getUserElderlyUsers(req.user.id);
      const hasAccess = relations.some(relation => relation.id === elderlyUserId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "No tienes permisos para editar este perfil" });
      }
      
      // Procesar y limpiar los datos de actualización
      const rawData = req.body;
      const updateData: any = {};
      
      // Solo copiar campos que realmente necesitamos actualizar y que no son problemáticos
      const allowedFields = [
        'firstName', 'lastName', 'gender', 'phoneNumber', 'address',
        'healthStatus', 'medicalHistory', 'medicalConditions',
        'diagnoses', 'medications', 'allergies', 'sensitivities',
        'mobilityStatus', 'mobilityAids', 'visionStatus', 'hearingStatus', 'speechStatus',
        'emergencyContact', 'careInstructions', 'robotId', 'isActive'
      ];
      
      allowedFields.forEach(field => {
        if (rawData[field] !== undefined) {
          updateData[field] = rawData[field];
        }
      });
      
      // Manejar fecha de nacimiento especialmente
      if (rawData.dateOfBirth && typeof rawData.dateOfBirth === 'string') {
        const date = new Date(rawData.dateOfBirth);
        if (!isNaN(date.getTime())) {
          updateData.dateOfBirth = date;
        }
      }
      
      const updatedElderlyUser = await storage.updateElderlyUser(elderlyUserId, updateData);
      res.json(updatedElderlyUser);
    } catch (error) {
      console.error("Update elderly user error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Error interno del servidor" });
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

  // Audio upload endpoint for interactions
  app.post("/api/upload-audio", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      // Extract form data from request body
      const { transcription, sentimentScore, sentimentLabel, duration, wordCount } = req.body;
      
      if (!transcription) {
        return res.status(400).json({ message: "Transcription is required" });
      }

      // For now, we'll store the interaction without the actual audio file
      // In production, you would upload the audio to cloud storage (S3, Cloudinary, etc.)
      const interactionData = {
        elderlyUserId: req.body.elderlyUserId || "demo-elderly-user", // Default for demo
        interactionType: "voice_recording" as const,
        content: transcription,
        sentimentScore: parseFloat(sentimentScore) || 0,
        sentimentLabel: sentimentLabel || "neutral",
        duration: parseInt(duration) || 0,
        metadata: {
          wordCount: parseInt(wordCount) || 0,
          audioProcessed: true,
          uploadTimestamp: new Date().toISOString()
        }
      };

      const interaction = await storage.createInteraction(interactionData);
      
      res.status(201).json({ 
        message: "Audio processed successfully",
        interactionId: interaction.id,
        interaction 
      });
    } catch (error) {
      console.error("Audio upload error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Error processing audio"
      });
    }
  });

  // Note: Static file serving is handled by Vercel's CDN in production
  // Local file uploads should use cloud storage (S3, Cloudinary, etc.) for Vercel deployment
}
