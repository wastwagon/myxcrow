import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * 
 * Note: For API-first architecture with JWT tokens, CSRF is less critical
 * but still recommended for state-changing operations. This implementation
 * provides basic CSRF protection that can be enhanced for cookie-based sessions.
 * 
 * For JWT-based APIs, consider:
 * - Using SameSite cookies if using cookies
 * - Requiring CSRF tokens only for cookie-based auth
 * - Skipping for token-based auth (current implementation)
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  private readonly tokenStore = new Map<string, { token: string; expiresAt: number }>();
  private readonly tokenExpiry = 3600000; // 1 hour
  private readonly enabled = process.env.CSRF_ENABLED === 'true';

  use(req: Request, res: Response, next: NextFunction) {
    // Skip if CSRF is disabled (default for JWT-based APIs)
    if (!this.enabled) {
      return next();
    }

    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Generate and set CSRF token for GET requests
      if (req.method === 'GET') {
        const sessionId = this.getSessionId(req);
        const token = this.generateToken();
        this.tokenStore.set(sessionId, {
          token,
          expiresAt: Date.now() + this.tokenExpiry,
        });

        res.setHeader('X-CSRF-Token', token);
        // Note: Cookie support requires cookie-parser middleware
        if (req.cookies) {
          res.cookie('csrf-token', token, {
            httpOnly: false, // Needs to be readable by JS
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: this.tokenExpiry,
          });
        }
      }
      return next();
    }

    // Skip CSRF for webhook endpoints (they use signature verification)
    if (req.path.includes('/webhook/')) {
      return next();
    }

    // Skip CSRF for health checks
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }

    // Skip CSRF for JWT-authenticated requests (JWT tokens are CSRF-resistant)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWT token present, CSRF not needed
      return next();
    }

    // Verify CSRF token for state-changing requests without JWT
    const sessionId = this.getSessionId(req);
    const stored = this.tokenStore.get(sessionId);

    if (!stored || Date.now() > stored.expiresAt) {
      this.logger.warn(`CSRF token missing or expired for ${sessionId}`);
      throw new HttpException('Invalid or expired CSRF token', HttpStatus.FORBIDDEN);
    }

    const tokenFromHeader = req.headers['x-csrf-token'] as string;
    const tokenFromCookie = req.cookies?.['csrf-token'];

    if (!tokenFromHeader && !tokenFromCookie) {
      this.logger.warn(`CSRF token not provided for ${sessionId}`);
      throw new HttpException('CSRF token required', HttpStatus.FORBIDDEN);
    }

    const providedToken = tokenFromHeader || tokenFromCookie;

    if (providedToken !== stored.token) {
      this.logger.warn(`CSRF token mismatch for ${sessionId}`);
      throw new HttpException('Invalid CSRF token', HttpStatus.FORBIDDEN);
    }

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    next();
  }

  private getSessionId(req: Request): string {
    // Use user ID if authenticated, otherwise use session ID or IP
    const user = (req as any).user;
    if (user?.id) {
      return `user_${user.id}`;
    }

    const sessionId = req.cookies?.['session-id'];
    if (sessionId) {
      return `session_${sessionId}`;
    }

    return `ip_${req.ip || req.socket.remoteAddress || 'unknown'}`;
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private cleanupExpiredTokens() {
    const now = Date.now();
    for (const [sessionId, data] of this.tokenStore.entries()) {
      if (now > data.expiresAt) {
        this.tokenStore.delete(sessionId);
      }
    }
  }
}

