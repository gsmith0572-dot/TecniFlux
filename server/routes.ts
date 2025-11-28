import jwt from "jsonwebtoken";
import { authenticateJWT } from "./jwt-middleware";
import type { Express, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { Readable } from "stream";
import storage from "./storage";
import { searchVehicleResources, searchByVIN } from "./gemini";
import Stripe from "stripe";
import { 
  hashPassword, 
  verifyPassword, 
  requireAuth, 
  requireRole, 
  getCurrentUser,
  generateResetToken,
  hashResetToken,
  isResetTokenExpired,
  getResetTokenExpiration
} from "./auth";
import { z } from "zod";
import multer from "multer";
import { uploadPDFToDrive, deleteFileFromDrive, downloadFileFromDrive } from "./google-drive";
import { sendPasswordResetEmail, sendUsernameReminderEmail } from "./email";
import { passwordResetLimiter, usernameReminderLimiter, checkEmailRateLimit } from "./rate-limit";
import type { Diagram } from "../shared/schema";
import { importFromGoogleSheet } from "./import-sheets";
import { renderSecurePDFViewer } from "./pdf-viewer-template";

// Configure multer for PDF uploads (memory storage, 10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten archivos PDF'));
    }
    cb(null, true);
  },
});

// Blueprint: javascript_stripe - Stripe integration
// Use test mode keys for development
const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('Missing required Stripe secret: TESTING_STRIPE_SECRET_KEY or STRIPE_SECRET_KEY');
}
const stripe = new Stripe(stripeSecretKey);

// Helper function to sanitize diagrams before sending to frontend
// NEVER expose directUrl or fileUrl to prevent unauthorized downloads
function sanitizeDiagram(diagram: Diagram): Omit<Diagram, 'directUrl' | 'fileUrl'> {
  const { directUrl, fileUrl, ...safeDiagram } = diagram;
  return safeDiagram;
}

function sanitizeDiagrams(diagrams: Diagram[]): Omit<Diagram, 'directUrl' | 'fileUrl'>[] {
  return diagrams.map(sanitizeDiagram);
}

// Plan configurations
const PLAN_CONFIG = {
  free: {
    limit: 3,
    priceId: null,
  },
  premium: {
    limit: 30,
    priceId: process.env.STRIPE_PRICE_PREMIUM || null,
  },
  plus: {
    limit: -1,
    priceId: process.env.STRIPE_PRICE_PLUS || null,
  },
  pro: {
    limit: -1,
    priceId: process.env.STRIPE_PRICE_PRO || null,
  },
} as const;

// Check for missing price IDs at startup (non-production only)
if (process.env.NODE_ENV !== 'production') {
  const missingPrices: string[] = [];
  if (!PLAN_CONFIG.premium.priceId) missingPrices.push('STRIPE_PRICE_PREMIUM');
  if (!PLAN_CONFIG.plus.priceId) missingPrices.push('STRIPE_PRICE_PLUS');
  if (!PLAN_CONFIG.pro.priceId) missingPrices.push('STRIPE_PRICE_PRO');

  if (missingPrices.length > 0) {
    console.warn(
      '[Stripe Config] Faltan variables de entorno para los precios:',
      missingPrices.join(', ')
    );
  } else {
    console.log('[Stripe Config] Precios cargados correctamente desde .env');
  }
}

// Helper function to handle Stripe webhook events
async function handleStripeWebhookEvent(event: any, res: any) {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        // Find user by metadata or customer ID
        const userId = session.metadata?.userId;
        const planId = session.metadata?.plan;
        
        if (userId && planId && subscriptionId) {
          const plan = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG];
          if (!plan) {
            console.error(`Webhook: Invalid plan ${planId}`);
            return res.status(400).json({ error: "Invalid plan" });
          }
          
          // Update user with Stripe info and subscription
          await storage.updateUserStripeInfo(userId, customerId, subscriptionId);
          await storage.updateUserSubscription(userId, planId, plan.limit);
          
          console.log(`✅ Checkout completed for user ${userId} - Plan: ${planId}, Subscription: ${subscriptionId}`);
        } else {
          console.error('Webhook: Missing metadata in checkout session', {
            userId,
            planId,
            subscriptionId
          });
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find user by Stripe customer ID
        const user = await storage.getUserByStripeCustomerId(customerId);
        if (!user) {
          console.error(`Webhook: User not found for Stripe customer ${customerId}`);
          return res.status(404).json({ error: "User not found" });
        }
        
        // Determine plan from price ID
        let planId: string = 'free';
        const priceId = subscription.items.data[0]?.price.id;
        
        if (priceId === PLAN_CONFIG.premium.priceId) planId = 'premium';
        else if (priceId === PLAN_CONFIG.plus.priceId) planId = 'plus';
        else if (priceId === PLAN_CONFIG.pro.priceId) planId = 'pro';
        
        const plan = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG];
        
        // Update user subscription
        await storage.updateUserStripeInfo(user.id, customerId, subscription.id);
        await storage.updateUserSubscription(user.id, planId, plan.limit);
        
        console.log(`Subscription ${subscription.id} updated for user ${user.id} - Plan: ${planId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object;
        const customerId = deletedSub.customer;
        
        // Find user by Stripe customer ID
        const user = await storage.getUserByStripeCustomerId(customerId);
        if (!user) {
          console.error(`Webhook: User not found for Stripe customer ${customerId}`);
          return res.status(404).json({ error: "User not found" });
        }
        
        // Downgrade to free plan
        await storage.updateUserSubscription(user.id, 'free', PLAN_CONFIG.free.limit);
        console.log(`Subscription deleted for user ${user.id} - downgraded to free`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;
        
        if (subscriptionId && customerId) {
          // Find user by Stripe customer ID
          const user = await storage.getUserByStripeCustomerId(customerId as string);
          if (!user) {
            console.error(`Webhook: User not found for Stripe customer ${customerId}`);
            break;
          }
          
          // Reset the user's search count for the new billing period
          await storage.updateUserSubscription(user.id, user.subscriptionPlan!, user.searchesLimit!);
          
          // Create payment record
          await storage.createPayment({
            userId: user.id,
            amount: (invoice.amount_paid / 100).toString(), // Convert from cents
            currency: invoice.currency,
            status: 'paid',
            plan: user.subscriptionPlan!,
            stripePaymentId: invoice.payment_intent as string,
          });
          
          console.log(`Payment succeeded for user ${user.id} - search count reset`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object;
        console.error('Payment failed:', failedInvoice.id);
        // TODO: Send notification to user about failed payment
        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook event processing error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // SPECIAL SETUP ENDPOINT (temporary - creates admin if none exists)
  // ============================================================================
  app.post("/api/setup-admin", async (req, res) => {
    try {
      // Security: Require setup key
      const { setupKey } = req.body;
      if (setupKey !== 'tecniflux-setup-2024-secure') {
        return res.status(403).json({ error: "Invalid setup key" });
      }

      // Check if admin user already exists
      const adminUser = await storage.getUserByUsername('admin');
      if (adminUser) {
        return res.status(200).json({ message: "Admin user already exists - you can login now", canLogin: true });
      }

      // Create admin user
      const hashedPassword = await hashPassword('admin123');
      await storage.createUser({
        username: 'admin',
        email: 'admin@tecniflux.com',
        password: hashedPassword,
      });

      // Update to admin role (since createUser only creates tecnico)
      const newAdmin = await storage.getUserByUsername('admin');
      if (newAdmin) {
        await storage.updateUserRole(newAdmin.id, 'admin');
      }

      res.status(201).json({ 
        message: "✅ Admin user created successfully!",
        username: "admin",
        password: "admin123",
        note: "You can now login at /login"
      });
    } catch (error: any) {
      console.error('Setup admin error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================

  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const registerSchema = z.object({
        username: z.string().min(3).max(50),
        email: z.string().email(),
        password: z.string().min(6),
      });

      const { username, email, password } = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "El nombre de usuario ya existe" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user with secure defaults
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      // Regenerate session to prevent fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: "Error al crear sesión" });
        }

        req.session.userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ error: "Error al guardar sesión" });
          }

          // Update last access
          storage.updateLastAccess(user.id);

          res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          });
        });
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error('Register error:', error);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginSchema = z.object({
        username: z.string(),
        password: z.string(),
      });
      const { username, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }
      
      // Check if account is active
      if (user.isActive === 0) {
        return res.status(403).json({ error: "Cuenta desactivada. Contacte al administrador." });
      }
      
      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }
      
      // Check subscription from subscriptions table
      const subResult = await pool.query(
        "SELECT plan FROM subscriptions WHERE user_id = $1",
        [user.id]
      );
      const subscriptionPlan = subResult.rows.length > 0 ? subResult.rows[0].plan : 'free';
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '7d' }
      );
      
      // Also maintain session for web compatibility
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
        }
        req.session.userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
          }
        });
      });
      
      // Update last access
      storage.updateLastAccess(user.id);
      
      // Return user data + JWT token with REAL subscription plan
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          subscriptionPlan: subscriptionPlan,
        },
        token: token
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos" });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  });
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Error al cerrar sesión" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Update last access
    await storage.updateLastAccess(user.id);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      searchesUsed: user.searchesUsed,
      searchesLimit: user.searchesLimit,
    });
  });

  // ============================================================================
  // PASSWORD RECOVERY ROUTES
  // ============================================================================

  // Request password reset
  app.post("/api/auth/request-password-reset", passwordResetLimiter, async (req, res) => {
    try {
      const requestSchema = z.object({
        email: z.string().email(),
      });

      const { email } = requestSchema.parse(req.body);
      const normalizedEmail = email.toLowerCase().trim();

      // Check email-based rate limit (secondary layer)
      if (!checkEmailRateLimit(normalizedEmail, 5, 15 * 60 * 1000)) {
        return res.status(429).json({
          error: "Demasiados intentos para este correo electrónico. Intente más tarde.",
        });
      }

      // Always respond with success to prevent user enumeration
      // Actual email sending happens in background
      const sendResponse = () => {
        res.json({
          success: true,
          message: "Si su correo está registrado, recibirá instrucciones para restablecer su contraseña.",
        });
      };

      // Find user by email
      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
        return sendResponse();
      }

      // Check if user is active
      if (user.isActive === 0) {
        console.log(`Password reset requested for inactive user: ${user.id}`);
        return sendResponse();
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const hashedToken = hashResetToken(resetToken);
      const expiresAt = getResetTokenExpiration();

      // Save token to database
      await storage.setPasswordResetToken(user.id, hashedToken, expiresAt);

      // Send email (async, don't await to prevent timing attacks)
      sendPasswordResetEmail({
        to: user.email!,
        resetToken,
        username: user.username,
      }).catch((err) => {
        console.error('Error sending password reset email:', err);
      });

      console.log(`Password reset requested for user: ${user.id}`);
      sendResponse();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Email inválido" });
      }
      console.error('Password reset request error:', error);
      res.status(500).json({ error: "Error al procesar solicitud" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", passwordResetLimiter, async (req, res) => {
    try {
      const resetSchema = z.object({
        token: z.string().min(1),
        password: z.string().min(6).max(128),
        confirmPassword: z.string(),
      });

      const { token, password, confirmPassword } = resetSchema.parse(req.body);

      // Validate password confirmation
      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Las contraseñas no coinciden" });
      }

      // Hash token to look up in database
      const hashedToken = hashResetToken(token);

      // Find user by reset token
      const user = await storage.getUserByResetToken(hashedToken);
      if (!user) {
        return res.status(400).json({ 
          error: "Token inválido o expirado. Solicite un nuevo enlace de recuperación.",
        });
      }

      // Verify token expiration
      if (isResetTokenExpired(user.passwordResetExpires)) {
        // Clear expired token
        await storage.clearPasswordResetToken(user.id);
        return res.status(400).json({
          error: "Token expirado. Solicite un nuevo enlace de recuperación.",
        });
      }

      // Check if user is active
      if (user.isActive === 0) {
        return res.status(403).json({ 
          error: "Cuenta inactiva. Contacte al administrador.",
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);

      // Update password FIRST (critical: don't clear token until password is updated)
      const updatedUser = await storage.updatePassword(user.id, hashedPassword);
      if (!updatedUser) {
        throw new Error("Error al actualizar contraseña");
      }

      // Clear reset token ONLY after successful password update
      await storage.clearPasswordResetToken(user.id);

      // Invalidate all sessions for this user (security best practice)
      // Note: With session-based auth, we can't easily invalidate all sessions
      // The user will need to login again with new password
      
      console.log(`Password reset successful for user: ${user.id}`);
      
      res.json({
        success: true,
        message: "Contraseña restablecida exitosamente. Ahora puede iniciar sesión con su nueva contraseña.",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos" });
      }
      console.error('Password reset error:', error);
      res.status(500).json({ error: "Error al restablecer contraseña" });
    }
  });

  // Request username reminder
  app.post("/api/auth/request-username-reminder", usernameReminderLimiter, async (req, res) => {
    try {
      const requestSchema = z.object({
        email: z.string().email(),
      });

      const { email } = requestSchema.parse(req.body);
      const normalizedEmail = email.toLowerCase().trim();

      // Check email-based rate limit
      if (!checkEmailRateLimit(normalizedEmail, 3, 15 * 60 * 1000)) {
        return res.status(429).json({
          error: "Demasiados intentos. Intente más tarde.",
        });
      }

      // Always respond with generic message to prevent enumeration
      const sendResponse = () => {
        res.json({
          success: true,
          message: "Si encontramos información válida, enviaremos un mensaje a su correo registrado.",
        });
      };

      // Find user by email
      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        console.log(`Username reminder requested for non-existent email: ${normalizedEmail}`);
        return sendResponse();
      }

      // Check if user is active
      if (user.isActive === 0) {
        console.log(`Username reminder requested for inactive user: ${user.id}`);
        return sendResponse();
      }

      // Send username reminder email (async, don't await)
      sendUsernameReminderEmail({
        to: user.email!,
        username: user.username,
      }).catch((err) => {
        console.error('Error sending username reminder email:', err);
      });

      console.log(`Username reminder sent for user: ${user.id}`);
      sendResponse();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Email inválido" });
      }
      console.error('Username reminder error:', error);
      res.status(500).json({ error: "Error al procesar solicitud" });
    }
  });

  // ============================================================================
  // SEARCH ROUTES (Protected)
  // ============================================================================

  // Get unique filter values for dropdowns
  app.get("/api/diagrams/filters", requireAuth, async (req, res) => {
    try {
      const filters = await storage.getDiagramFilters();
      res.json(filters);
    } catch (error) {
      console.error("Error getting diagram filters:", error);
      res.status(500).json({ 
        error: "Error al obtener filtros",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // ✅ RUTA GET (Móvil)
  app.get("/api/diagrams/search", authenticateJWT, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
      // TEMPORAL: Validación de límite de búsquedas deshabilitada para desarrollo
      // TODO: Re-habilitar cuando se implementen límites reales
      // const canSearch = await storage.canUserSearch(userId);
      // if (!canSearch) {
      //   return res.status(403).json({ error: "Límite de búsquedas alcanzado" });
      // }

      // Obtener parámetros de la URL (Query Params)
      const query = req.query.q as string || req.query.query as string || '';
      const make = req.query.make as string;
      const model = req.query.model as string;
      const year = req.query.year as string;
      const system = req.query.system as string;

      const result = await storage.smartSearchDiagrams({
        query,
        make,
        model,
        year,
        system,
        onlyComplete: false,
        limit: 50,
        offset: 0,
      });

      if (result.diagrams.length > 0) {
        await storage.incrementSearchCount(userId);
      }

      const sanitizedResult = {
        ...result,
        diagrams: sanitizeDiagrams(result.diagrams)
      };

      res.json(sanitizedResult);
    } catch (error) {
      console.error("Search GET error:", error);
      res.status(500).json({ error: "Error al buscar diagramas" });
    }
  });

  // Endpoint para búsqueda de diagramas en la base de datos (Original POST - Web)
  app.post("/api/diagrams/search", authenticateJWT, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
      // TEMPORAL: Validación de límite de búsquedas deshabilitada para desarrollo
      // TODO: Re-habilitar cuando se implementen límites reales
      // Check if user can search
      // const canSearch = await storage.canUserSearch(userId);
      // if (!canSearch) {
      //   return res.status(403).json({
      //     error: "Límite de búsquedas alcanzado",
      //     message: "Has alcanzado tu límite de búsquedas mensuales. Actualiza tu plan para continuar."
      //   });
      // }

      const { query, make, model, year, system, onlyComplete, limit, offset } = req.body;

      // Perform smart search
      const result = await storage.smartSearchDiagrams({
        query,
        make,
        model,
        year,
        system,
        onlyComplete: onlyComplete || false,
        limit: limit || 50,
        offset: offset || 0,
      });

      // Increment search count only if results found
      if (result.diagrams.length > 0) {
        await storage.incrementSearchCount(userId);
      }

      // Sanitize diagrams to remove sensitive URLs
      const sanitizedResult = {
        ...result,
        diagrams: sanitizeDiagrams(result.diagrams)
      };

      res.json(sanitizedResult);
    } catch (error) {
      console.error("Error en búsqueda de diagramas:", error);
      res.status(500).json({ 
        error: "Error al buscar diagramas",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Endpoint para obtener un diagrama por ID
  app.get("/api/diagrams/:id", authenticateJWT, async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "ID requerido" });
      }

      const diagram = await storage.getDiagram(id);

      if (!diagram) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }

      res.json({ diagram });
    } catch (error: any) {
      console.error('Error obteniendo diagrama:', error);
      res.status(500).json({ error: "Error obteniendo diagrama" });
    }
  });

  // Endpoint para búsqueda web con Gemini basada en filtros de vehículo
  app.post("/api/search/web", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
      // Check if user can search
      const canSearch = await storage.canUserSearch(userId);
      if (!canSearch) {
        return res.status(403).json({
          error: "Límite de búsquedas alcanzado",
          message: "Has alcanzado tu límite de búsquedas mensuales. Actualiza tu plan para continuar."
        });
      }

      const { make, model, year, system, keyword } = req.body;

      if (!make || !model || !year) {
        return res.status(400).json({ 
          error: "Se requieren marca, modelo y año del vehículo" 
        });
      }

      const results = await searchVehicleResources(
        make,
        model,
        year,
        system,
        keyword
      );

      // Increment search count
      await storage.incrementSearchCount(req.session!.userId!);

      res.json(results);
    } catch (error) {
      console.error("Error en búsqueda web:", error);
      res.status(500).json({ 
        error: "Error al buscar recursos en internet",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Endpoint para búsqueda web con Gemini basada en VIN
  app.post("/api/search/vin", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
      // Check if user can search
      const canSearch = await storage.canUserSearch(userId);
      if (!canSearch) {
        return res.status(403).json({
          error: "Límite de búsquedas alcanzado",
          message: "Has alcanzado tu límite de búsquedas mensuales. Actualiza tu plan para continuar."
        });
      }

      const { vin } = req.body;

      if (!vin || vin.length !== 17) {
        return res.status(400).json({ 
          error: "Se requiere un VIN válido de 17 caracteres" 
        });
      }

      const results = await searchByVIN(vin);

      // Increment search count
      await storage.incrementSearchCount(userId);

      res.json(results);
    } catch (error) {
      console.error("Error en búsqueda VIN:", error);
      res.status(500).json({ 
        error: "Error al buscar información del VIN",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // ============================================================================
  // DIAGRAM HISTORY ROUTES (Protected)
  // ============================================================================
  
  // Record diagram view (called when user views a PDF)
  app.post("/api/diagrams/:id/view", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const diagramId = req.params.id;
      
      // Verify diagram exists
      const diagram = await storage.getDiagram(diagramId);
      if (!diagram) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }
      
      // Record view in history
      const historyEntry = await storage.addDiagramView(userId, diagramId);
      
      res.json({ success: true, viewedAt: historyEntry.viewedAt });
    } catch (error) {
      console.error('Error recording diagram view:', error);
      res.status(500).json({ error: "Error al registrar visualización" });
    }
  });

  // Serve HTML page with secure PDF viewer (no direct download UI)
  app.get("/api/diagrams/:id/view", requireAuth, async (req, res) => {
    const diagramId = req.params.id;
    console.log(`[PDF View] Request received for diagram: ${diagramId}`);
    
    try {
      const userId = req.session!.userId!;
      
      // 1. Verify user exists and has active subscription
      const user = await storage.getUser(userId);
      if (!user) {
        console.log(`[PDF View] User not found: ${userId}`);
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      if (!user.isActive) {
        console.log(`[PDF View] User inactive: ${userId}`);
        return res.status(403).json({ error: "Cuenta inactiva" });
      }
      
      // 2. Check subscription status
      if (user.subscriptionStatus !== "active") {
        console.log(
          `[PDF View] Subscription inactive: ${userId}, status: ${user.subscriptionStatus}`
        );
        return res.status(403).json({ error: "Suscripción inactiva" });
      }
      
      // 3. Verify diagram exists
      const diagram = await storage.getDiagram(diagramId);
      if (!diagram) {
        console.log(`[PDF View] Diagram not found: ${diagramId}`);
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }
      
      console.log(`[PDF View] Serving secure viewer for diagram: ${diagramId}`);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("Referrer-Policy", "no-referrer");

      const html = renderSecurePDFViewer(diagramId);
      res.send(html);
    } catch (error) {
      console.error("[PDF View] Error:", error);
      res.status(500).json({ error: "Error al cargar visor seguro" });
    }
  });

  // Helper function to generate a minimal valid PDF for development/testing
  function generateSamplePDF(diagram: Diagram): Buffer {
    const text = `TecniFlux DEV PDF - ${diagram.make || 'N/A'} ${diagram.model || 'N/A'} ${diagram.year || 'N/A'} - ${diagram.system || 'N/A'}`;
    const streamContent = `BT
/F1 18 Tf
10 100 Td
(${text.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) Tj
0 -20 Td
(ID: ${diagram.id}) Tj
ET`;
    const pdf = `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${Buffer.byteLength(streamContent, 'utf-8')} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000294 00000 n
0000000401 00000 n
trailer
<< /Root 1 0 R /Size 6 >>
startxref
520
%%EOF`;
    return Buffer.from(pdf, 'utf-8');
  }

  function generateErrorPDF(diagram: Diagram | null, userMessage: string): Buffer {
    const line1 = "TecniFlux - Aviso de diagrama";
    const line2 = userMessage || "No fue posible cargar este diagrama.";
    
    const metaLine = diagram
      ? `ID: ${diagram.id} | ${diagram.make || 'N/A'} ${diagram.model || 'N/A'} ${diagram.year || ''} - ${diagram.system || ''}`
      : "ID de diagrama no disponible";
    
    const streamLines = [
      "BT",
      "/F1 16 Tf",
      "20 110 Td",
      `(${line1.replace(/\(/g, "\\(").replace(/\)/g, "\\)")}) Tj`,
      "0 -24 Td",
      "/F1 12 Tf",
      `(${line2.replace(/\(/g, "\\(").replace(/\)/g, "\\)")}) Tj`,
      "0 -18 Td",
      "/F1 10 Tf",
      `(${metaLine.replace(/\(/g, "\\(").replace(/\)/g, "\\)")}) Tj`,
      "ET"
    ];
    
    const streamContent = streamLines.join("\n");
    const length = Buffer.byteLength(streamContent, "utf-8");
    
    const pdf = `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 160] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${length} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000309 00000 n
0000000416 00000 n
trailer
<< /Root 1 0 R /Size 6 >>
startxref
520
%%EOF`;
    return Buffer.from(pdf, "utf-8");
  }

  function generateErrorPDF(diagram: Diagram | null, userMessage: string): Buffer {
    const line1 = "TecniFlux - Aviso de diagrama";
    const line2 = userMessage || "No fue posible cargar este diagrama.";
    
    const metaLine = diagram
      ? `ID: ${diagram.id} | ${diagram.make || 'N/A'} ${diagram.model || 'N/A'} ${diagram.year || ''} - ${diagram.system || ''}`
      : "ID de diagrama no disponible";
    
    const streamLines = [
      "BT",
      "/F1 16 Tf",
      "20 110 Td",
      `(${line1.replace(/\(/g, "\\(").replace(/\)/g, "\\)")}) Tj`,
      "0 -24 Td",
      "/F1 12 Tf",
      `(${line2.replace(/\(/g, "\\(").replace(/\)/g, "\\)")}) Tj`,
      "0 -18 Td",
      "/F1 10 Tf",
      `(${metaLine.replace(/\(/g, "\\(").replace(/\)/g, "\\)")}) Tj`,
      "ET"
    ];
    
    const streamContent = streamLines.join("\n");
    const length = Buffer.byteLength(streamContent, "utf-8");
    
    const pdf = `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 160] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${length} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000309 00000 n
0000000416 00000 n
trailer
<< /Root 1 0 R /Size 6 >>
startxref
520
%%EOF`;
    return Buffer.from(pdf, "utf-8");
  }

    // Serve raw PDF through secure proxy (used ONLY by the internal viewer iframe)
    app.get("/api/diagrams/:id/file", requireAuth, async (req, res) => {
      const diagramId = req.params.id;
      console.log(`[PDF File] Request received for diagram: ${diagramId}`);
      
      let diagram: Diagram | null = null;
      
      try {
        const userId = req.session!.userId!;
  
        // 1. Verify user exists and has active subscription
        const user = await storage.getUser(userId);
        if (!user) {
          console.log(`[PDF File] User not found: ${userId}`);
          const errorBuffer = generateErrorPDF(
            null,
            "Usuario no encontrado. Por favor, inicia sesión nuevamente."
          );
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", 'inline; filename="diagram-error.pdf"');
          res.setHeader("Content-Length", errorBuffer.length.toString());
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("X-Frame-Options", "SAMEORIGIN");
          res.setHeader("Referrer-Policy", "no-referrer");
          return res.status(200).send(errorBuffer);
        }
  
        if (!user.isActive) {
          console.log(`[PDF File] User inactive: ${userId}`);
          const errorBuffer = generateErrorPDF(
            null,
            "Tu cuenta está inactiva. Por favor, contacta al administrador."
          );
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", 'inline; filename="diagram-error.pdf"');
          res.setHeader("Content-Length", errorBuffer.length.toString());
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("X-Frame-Options", "SAMEORIGIN");
          res.setHeader("Referrer-Policy", "no-referrer");
          return res.status(200).send(errorBuffer);
        }
  
        if (user.subscriptionStatus !== "active") {
          console.log(
            `[PDF File] Subscription inactive: ${userId}, status: ${user.subscriptionStatus}`
          );
          const errorBuffer = generateErrorPDF(
            null,
            "Tu suscripción no está activa. Por favor, renueva tu suscripción para acceder a los diagramas."
          );
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", 'inline; filename="diagram-error.pdf"');
          res.setHeader("Content-Length", errorBuffer.length.toString());
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("X-Frame-Options", "SAMEORIGIN");
          res.setHeader("Referrer-Policy", "no-referrer");
          return res.status(200).send(errorBuffer);
        }
  
        // 2. Verify diagram exists
        const diagramResult = await storage.getDiagram(diagramId);
        if (!diagramResult) {
          console.log(`[PDF File] Diagram not found: ${diagramId}`);
          const errorBuffer = generateErrorPDF(
            null,
            "Este diagrama no fue encontrado en TecniFlux."
          );
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", 'inline; filename="diagram-error.pdf"');
          res.setHeader("Content-Length", errorBuffer.length.toString());
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("X-Frame-Options", "SAMEORIGIN");
          res.setHeader("Referrer-Policy", "no-referrer");
          return res.status(200).send(errorBuffer);
        }
        diagram = diagramResult;
  
        let buffer: Buffer | null = null;
  
        try {
          // 1. Intentar obtener fileId
          let fileId = diagram.fileId || null;
  
          if (!fileId && diagram.directUrl) {
            try {
              const url = new URL(diagram.directUrl);
              const extractedId = url.searchParams.get("id");
              if (extractedId) {
                fileId = extractedId;
              }
            } catch (urlError) {
              console.log(`[PDF File] Invalid directUrl format for diagram ${diagramId}: ${diagram.directUrl}`);
            }
          }
  
          // 2. Si tenemos fileId, intentar descargar desde Drive
          if (fileId) {
            console.log(`[PDF File] Trying to download PDF from Drive, fileId: ${fileId}`);
            buffer = await downloadFileFromDrive(fileId);
            console.log(`[PDF File] PDF loaded from Drive, size: ${buffer.length} bytes`);
          } else {
            console.log(`[PDF File] No fileId available for diagram: ${diagramId}`);
          }
        } catch (driveError) {
          console.error("[PDF File] Error downloading from Drive:", driveError);
        }
  
        // 3. Si no tenemos buffer (no fileId o fallo en descarga), usar PDF de desarrollo
        if (!buffer) {
          console.log(`[PDF File] Using DEV fallback PDF for diagram: ${diagramId}`);
          buffer = generateSamplePDF(diagram);
        }
  
        // Set headers for inline PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'inline; filename="diagram.pdf"');
        res.setHeader("Content-Length", buffer.length.toString());
        res.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, private"
        );
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader("Referrer-Policy", "no-referrer");
  
        res.send(buffer);
      } catch (error) {
        console.error("[PDF File] Error:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("[PDF File] Error details:", errorMessage);
        
        const isDev = process.env.NODE_ENV === "development";
        const friendlyMessage = "No hemos podido cargar este diagrama desde TecniFlux Drive. Intenta nuevamente más tarde o contacta al administrador.";
        
        try {
          const errorBuffer = generateErrorPDF(
            diagram,
            friendlyMessage
          );
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", 'inline; filename="diagram-error.pdf"');
          res.setHeader("Content-Length", errorBuffer.length.toString());
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("X-Frame-Options", "SAMEORIGIN");
          res.setHeader("Referrer-Policy", "no-referrer");
          res.setHeader("X-Debug-Event", "PDF_ERROR");
          res.setHeader("X-Debug-Message", `Error serving PDF for diagram ${diagramId}: ${errorMessage}`);
          return res.status(200).send(errorBuffer);
        } catch (secondaryError) {
          // Si algo RARO falla incluso al generar el PDF de error,
          // como último recurso, manda JSON 500 (sobre todo útil en desarrollo)
          console.error("[PDF File] Secondary error generating error PDF:", secondaryError);
          return res.status(500).json({
            error: "Error al servir el archivo",
            details: isDev ? errorMessage : undefined,
          });
        }
      }
    })
    
  // Get user's view history (last 3 diagrams)
  app.get("/api/user/history", requireAuth, async (req, res) => {

  // Get user subscription status
  app.get("/api/user/subscription", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      
      const result = await pool.query(
        "SELECT plan, status, current_period_end, cancel_at_period_end FROM subscriptions WHERE user_id = $1",
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.json({
          plan: "free",
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
          cancelAtPeriodEnd: false
        });
      }
      
      const sub = result.rows[0];
      res.json({
        plan: sub.plan,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end
      });
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ error: "Error al obtener suscripción" });
    }
  });
    try {
      const userId = req.session!.userId!;
      const limit = parseInt(req.query.limit as string) || 3;
      
      const history = await storage.getUserHistory(userId, limit);
      
      // Sanitize diagrams in history
      const sanitizedHistory = history.map(item => ({
        ...item,
        diagram: item.diagram ? sanitizeDiagram(item.diagram) : null
      }));
      
      res.json({ history: sanitizedHistory });
    } catch (error) {
      console.error('Error getting user history:', error);
      res.status(500).json({ error: "Error al obtener historial" });
    }
  });

  // Stripe: Create subscription
  app.post("/api/create-subscription", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;

      const { planId } = req.body;

      if (!planId || !PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG]) {
        return res.status(400).json({ error: "Plan inválido" });
      }

      const plan = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG];

      // Plan gratuito no pasa por Stripe
      if (planId === "free") {
        await storage.updateUserSubscription(userId, planId, plan.limit);
        return res.json({ success: true, message: "Plan gratuito activado" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      if (!user.email) {
        return res.status(400).json({ error: "El usuario debe tener un email registrado" });
      }

      let customerId = user.stripeCustomerId || "";

      // 1) Verificar si el customer existente sigue siendo válido en Stripe
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId);
        } catch (err: any) {
          const msg = err?.message || err?.raw?.message || "";
          const code = err?.code;

          if (
            code === "resource_missing" ||
            msg.includes("No such customer")
          ) {
            console.warn(
              `[Stripe] Customer inválido en Stripe para user ${userId}, customerId=${customerId}. Creando uno nuevo...`
            );

            customerId = "";
            // Limpiamos el customerId guardado en BD pero dejamos la suscripción si existiera
            await storage.updateUserStripeInfo(
              userId,
              "",
              user.stripeSubscriptionId || ""
            );
          } else {
            // Otro tipo de error -> relanzar
            throw err;
          }
        }
      }

      // 2) Crear customer nuevo si no hay uno válido
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId,
            plan: planId,
          },
        });

        customerId = customer.id;
        await storage.updateUserStripeInfo(
          userId,
          customerId,
          user.stripeSubscriptionId || ""
        );

        console.log(
          `✅ Nuevo Stripe customer creado para user ${userId}: ${customerId}`
        );
      }

      // 3) Comprobar suscripción previa
      if (user.stripeSubscriptionId) {
        try {
          const existingSub = await stripe.subscriptions.retrieve(
            user.stripeSubscriptionId
          );
          if (
            existingSub.status === "active" ||
            existingSub.status === "trialing"
          ) {
            return res.status(400).json({
              error: "Ya tienes una suscripción activa",
              subscriptionId: existingSub.id,
            });
          }
        } catch (err) {
          console.log(
            "[Stripe] Suscripción previa no encontrada o inválida, se creará una nueva."
          );
        }
      }

      // 4) Crear sesión de Checkout
      const baseUrl =
        process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : "http://localhost:5050";

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.priceId!,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: {
          userId,
          plan: planId,
        },
      });

      console.log("✅ Checkout session created successfully:", {
        sessionId: session.id,
        url: session.url,
      });

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);

      if (error && typeof error === "object") {
        console.error("Stripe create-subscription debug:", {
          type: (error as any).type,
          message: (error as any).message,
          rawType: (error as any).rawType,
          rawMessage: (error as any).rawMessage,
          code: (error as any).code,
          statusCode: (error as any).statusCode,
          requestId: (error as any).requestId,
        });
      }

      res.status(500).json({
        error: "Error al crear suscripción",
        details: error?.message,
      });
    }
  });

  // Verify checkout session (for success page)
  app.get("/api/verify-checkout", requireAuth, async (req, res) => {
    try {
      const sessionId = req.query.session_id as string;
      
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID requerido" });
      }

      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      res.json({
        status: session.status,
        plan: session.metadata?.plan,
        customer_email: session.customer_details?.email,
      });
    } catch (error: any) {
      console.error("Error verifying checkout session:", error);
      res.status(500).json({ error: "Error al verificar sesión" });
    }
  });

  // Stripe webhook handler - MUST be configured with raw body middleware
  // In production, add this before JSON middleware: app.use('/api/stripe-webhook', express.raw({type: 'application/json'}))
  app.post("/api/stripe-webhook", express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).send('No signature');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.warn('⚠️  WEBHOOK WARNING: No webhook secret configured. Signature verification skipped for development.');
      // In development without webhook secret, parse the body manually
      try {
        const bodyString = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
        const event = JSON.parse(bodyString);
        
        // Process event without verification (DEVELOPMENT ONLY)
        return handleStripeWebhookEvent(event, res);
      } catch (err: any) {
        console.error('Webhook parsing error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );

      // Process verified webhook event
      return handleStripeWebhookEvent(event, res);
    } catch (error: any) {
      console.error('Webhook signature verification error:', error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  // ==================== ADMIN ROUTES ====================
  
  // Admin Users - Get all users with pagination and filters
  app.get("/api/admin/users", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { limit = 50, offset = 0, role, isActive } = req.query;
      
      const users = await storage.getAllUsers(
        Number(limit),
        Number(offset),
        role as string | undefined,
        isActive !== undefined ? Number(isActive) : undefined
      );
      
      const total = await storage.getTotalUsersCount();
      
      // Remove passwords from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      
      res.json({
        users: sanitizedUsers,
        total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      console.error('Admin get users error:', error);
      res.status(500).json({ error: "Error al obtener usuarios" });
    }
  });

  // Admin Users - Get single user
  app.get("/api/admin/users/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      // Remove password from response
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      console.error('Admin get user error:', error);
      res.status(500).json({ error: "Error al obtener usuario" });
    }
  });

  // Admin Users - Update user role
  app.post("/api/admin/users/:id/role", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const roleSchema = z.object({
        role: z.enum(['admin', 'tecnico']),
      });
      
      const { role } = roleSchema.parse(req.body);
      const updatedUser = await storage.updateUserRole(req.params.id, role);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      const { password, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Rol inválido", details: error.errors });
      }
      console.error('Admin update role error:', error);
      res.status(500).json({ error: "Error al actualizar rol" });
    }
  });

  // Admin Users - Update user status (activate/deactivate)
  app.patch("/api/admin/users/:id/status", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const statusSchema = z.object({
        isActive: z.number().int().min(0).max(1),
      });
      
      const { isActive } = statusSchema.parse(req.body);
      const updatedUser = await storage.updateUserStatus(req.params.id, isActive);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      const { password, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Estado inválido", details: error.errors });
      }
      console.error('Admin update status error:', error);
      res.status(500).json({ error: "Error al actualizar estado" });
    }
  });

  // Admin Users - Search users
  app.get("/api/admin/users/search/:query", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.searchUsers(req.params.query);
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Admin search users error:', error);
      res.status(500).json({ error: "Error al buscar usuarios" });
    }
  });

  // Admin Diagrams - Get diagram stats
  app.get("/api/admin/diagrams/stats", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const stats = await storage.getDiagramStats();
      res.json(stats);
    } catch (error) {
      console.error('Admin get diagram stats error:', error);
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  });

  // Admin Diagrams - Get all diagrams with pagination, search and filters
  app.get("/api/admin/diagrams", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { limit = 50, offset = 0, query, make, year, status } = req.query;
      
      const result = await storage.adminSearchDiagrams({
        query: query as string,
        make: make as string,
        year: year as string,
        status: status as string,
        limit: Number(limit),
        offset: Number(offset),
      });
      
      res.json({
        diagrams: result.diagrams,
        total: result.total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      console.error('Admin get diagrams error:', error);
      res.status(500).json({ error: "Error al obtener diagramas" });
    }
  });

  // Admin Diagrams - Get single diagram
  app.get("/api/admin/diagrams/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const diagram = await storage.getDiagram(req.params.id);
      
      if (!diagram) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }
      
      res.json(diagram);
    } catch (error) {
      console.error('Admin get diagram error:', error);
      res.status(500).json({ error: "Error al obtener diagrama" });
    }
  });

  // Admin Diagrams - Create new diagram with PDF upload
  app.post("/api/admin/diagrams", requireAuth, requireRole('admin'), upload.single('file'), async (req, res) => {
    let createdDiagramId: string | null = null;
    let uploadedFileId: string | null = null;

    try {
      // Validate file exists
      if (!req.file) {
        return res.status(400).json({ error: "Se requiere un archivo PDF" });
      }

      // Validate form data
      const diagramSchema = z.object({
        make: z.string(),
        model: z.string(),
        year: z.string().transform(Number), // Form data comes as string
        systemType: z.string(),
        description: z.string().optional(),
        tags: z.string().optional().transform(str => str ? JSON.parse(str) : []), // Parse JSON string
      });
      
      const formData = diagramSchema.parse(req.body);

      // Step 1: Create diagram in database with temporary/placeholder values
      const diagram = await storage.createDiagram({
        fileName: req.file.originalname,
        fileId: '', // Temporary - will update after Drive upload
        fileUrl: '', // Temporary
        directUrl: '', // Temporary
        make: formData.make,
        model: formData.model,
        year: String(formData.year), // Convert to string for schema
        system: formData.systemType,
        tags: formData.tags ? JSON.stringify(formData.tags) : null,
        notes: formData.description || null,
      });

      createdDiagramId = diagram.id;

      // Step 2: Upload PDF to Google Drive
      try {
        const driveResult = await uploadPDFToDrive(
          req.file.buffer,
          req.file.originalname,
          'TecniFlux Diagrams'
        );

        uploadedFileId = driveResult.fileId;

        // Step 3: Update diagram with Google Drive info
        const updatedDiagram = await storage.updateDiagram(diagram.id, {
          fileId: driveResult.fileId,
          fileUrl: driveResult.fileUrl,
          directUrl: driveResult.directUrl,
        });

        if (!updatedDiagram) {
          throw new Error('Failed to update diagram with Drive info');
        }

        res.status(201).json(updatedDiagram);
      } catch (driveError) {
        // Rollback: Delete diagram from DB if Drive upload failed
        await storage.deleteDiagram(diagram.id);
        throw driveError;
      }
    } catch (error) {
      // Atomic rollback: Clean up both DB and Drive if something failed
      if (createdDiagramId && !uploadedFileId) {
        // DB created but Drive failed - already rolled back above
      } else if (uploadedFileId && createdDiagramId) {
        // Both created but update failed - delete both
        try {
          await storage.deleteDiagram(createdDiagramId);
          await deleteFileFromDrive(uploadedFileId);
          console.log(`Rolled back diagram ${createdDiagramId} and Drive file ${uploadedFileId}`);
        } catch (rollbackError) {
          console.error('Failed to rollback:', rollbackError);
        }
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "El archivo excede el límite de 10 MB" });
        }
        return res.status(400).json({ error: `Error de archivo: ${error.message}` });
      }
      console.error('Admin create diagram error:', error);
      res.status(500).json({ error: "Error al crear diagrama" });
    }
  });

  // Admin Diagrams - Update diagram
  app.patch("/api/admin/diagrams/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const updateSchema = z.object({
        fileName: z.string().optional(),
        fileUrl: z.string().url().optional(),
        directUrl: z.string().url().optional(),
        make: z.string().optional(),
        model: z.string().optional(),
        year: z.string().optional(),
        system: z.string().optional(),
        notes: z.string().optional(),
        tags: z.string().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const diagram = await storage.updateDiagram(req.params.id, updates);
      
      if (!diagram) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }
      
      res.json(diagram);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error('Admin update diagram error:', error);
      res.status(500).json({ error: "Error al actualizar diagrama" });
    }
  });

  // Admin Diagrams - Delete diagram
  app.delete("/api/admin/diagrams/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      // Get diagram to retrieve fileId before deletion
      const diagram = await storage.getDiagram(req.params.id);
      
      if (!diagram) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }

      // Delete from database
      const deleted = await storage.deleteDiagram(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Diagrama no encontrado" });
      }

      // Delete file from Google Drive (best effort - log errors but don't fail)
      if (diagram.fileId) {
        try {
          await deleteFileFromDrive(diagram.fileId);
          console.log(`Deleted Google Drive file: ${diagram.fileId}`);
        } catch (driveError) {
          console.error('Failed to delete Google Drive file:', driveError);
          // Continue - DB record is already deleted
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete diagram error:', error);
      res.status(500).json({ error: "Error al eliminar diagrama" });
    }
  });

  // Admin Diagrams - Import from Google Sheets
  app.post("/api/admin/diagrams/import", authenticateJWT, requireRole('admin'), async (req, res) => {
    try {
      const schema = z.object({
        spreadsheetId: z.string().min(1, "Spreadsheet ID es requerido"),
        sheetName: z.string().default('Sheet1'),
      });
      
      const { spreadsheetId, sheetName } = schema.parse(req.body);
      
      const result = await importFromGoogleSheet(spreadsheetId, sheetName);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error('Admin import diagrams error:', error);
      res.status(500).json({ 
        success: false,
        error: "Error al importar diagramas",
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // Admin Diagrams - Sync with default Google Sheet (same as import but uses configured sheet)
  app.post("/api/admin/diagrams/sync", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      // Use the configured Google Sheet ID
      const spreadsheetId = '1ZdRSgJs8XiC3LpIan-anzNt7xpm0DTEPG0tpYsO6WTQ';
      const sheetName = 'Index';
      
      console.log(`🔄 Sincronizando desde Google Sheet: ${spreadsheetId} (${sheetName})`);
      
      const result = await importFromGoogleSheet(spreadsheetId, sheetName);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Admin sync diagrams error:', error);
      res.status(500).json({ 
        success: false,
        error: "Error al sincronizar diagramas",
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // Admin Diagrams - Search diagrams
  app.get("/api/admin/diagrams/search/:query", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const diagrams = await storage.searchDiagrams(req.params.query);
      res.json(diagrams);
    } catch (error) {
      console.error('Admin search diagrams error:', error);
      res.status(500).json({ error: "Error al buscar diagramas" });
    }
  });

  // Admin Finance - Get monthly financial report
  app.get("/api/admin/finance/monthly", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { year, month } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({ error: "Se requieren year y month" });
      }
      
      const payments = await storage.getPaymentsByMonth(Number(year), Number(month));
      const revenue = await storage.getMonthlyRevenue(Number(year), Number(month));
      
      // Calculate financials
      const grossRevenue = revenue.gross;
      const transactionCount = revenue.count;
      const taxRate = 0.20; // 20% tax
      const operatingCost = 89; // $89/month
      
      const taxes = grossRevenue * taxRate;
      const netRevenue = grossRevenue - taxes - operatingCost;
      
      res.json({
        year: Number(year),
        month: Number(month),
        grossRevenue,
        taxes,
        operatingCost,
        netRevenue,
        transactionCount,
        payments,
      });
    } catch (error) {
      console.error('Admin finance error:', error);
      res.status(500).json({ error: "Error al obtener reporte financiero" });
    }
  });

  // Admin Settings - Get all settings
  app.get("/api/admin/settings", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error('Admin get settings error:', error);
      res.status(500).json({ error: "Error al obtener configuración" });
    }
  });

  // Admin Settings - Update setting
  app.post("/api/admin/settings", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const settingSchema = z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      });
      
      const { key, value, description } = settingSchema.parse(req.body);
      const setting = await storage.setSetting(key, value, description);
      
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error('Admin update setting error:', error);
      res.status(500).json({ error: "Error al actualizar configuración" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}