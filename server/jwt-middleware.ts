import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  // Primero intenta obtener token del header Authorization
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (token) {
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      ) as { userId: string };
      
      req.userId = decoded.userId;
      
      // También setear en session para compatibilidad con código existente
      if (req.session) {
        req.session.userId = decoded.userId;
      }
      
      return next();
    } catch (err) {
      console.error('JWT verification failed:', err);
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
  }
  
  // Si no hay token JWT, verificar si hay sesión (para web)
  if (req.session?.userId) {
    return next();
  }
  
  return res.status(401).json({ error: 'No autenticado' });
}
