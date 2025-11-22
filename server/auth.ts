import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "./storage";

// Extend Express Request type to include session userId and user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Middleware: Require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "No autenticado. Por favor inicie sesión." });
  }
  next();
}

// Middleware factory: Require specific role
export function requireRole(role: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    if (user.role !== role) {
      return res.status(403).json({ 
        error: "Acceso denegado. Se requiere permisos de administrador." 
      });
    }

    next();
  };
}

// Helper: Get current user from session
export async function getCurrentUser(req: Request) {
  if (!req.session?.userId) {
    return null;
  }
  return storage.getUser(req.session.userId);
}

// Generate secure password reset token (returns plaintext token to send via email)
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash reset token for storage (SHA-256)
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Check if reset token is expired
export function isResetTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
}

// Get token expiration time (configurable via env, defaults to 1 hour)
export function getResetTokenExpiration(): Date {
  const ttlSeconds = parseInt(process.env.RESET_TOKEN_TTL || '3600', 10);
  return new Date(Date.now() + ttlSeconds * 1000);
}
