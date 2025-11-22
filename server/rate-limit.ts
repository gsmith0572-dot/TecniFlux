import rateLimit from 'express-rate-limit';

// Generic rate limiter for password reset endpoints (IP-based)
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests per window per IP
  message: {
    error: 'Demasiados intentos. Por favor intente nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Username reminder limiter (stricter)
export const usernameReminderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 requests per window per IP
  message: {
    error: 'Demasiados intentos. Por favor intente nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory store for email-based throttling (secondary layer)
const emailAttempts = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of emailAttempts.entries()) {
    if (now > data.resetAt) {
      emailAttempts.delete(email);
    }
  }
}, 30 * 60 * 1000);

// Email-based rate limiting (secondary layer)
export function checkEmailRateLimit(email: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const attempt = emailAttempts.get(email);

  if (!attempt || now > attempt.resetAt) {
    // First attempt or window expired
    emailAttempts.set(email, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (attempt.count >= maxAttempts) {
    return false; // Rate limit exceeded
  }

  // Increment count
  attempt.count++;
  emailAttempts.set(email, attempt);
  return true;
}
