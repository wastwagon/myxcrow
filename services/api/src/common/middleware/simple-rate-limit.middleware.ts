import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger, Inject, forwardRef } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class SimpleRateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};
  private readonly logger = new Logger(SimpleRateLimitMiddleware.name);
  private cleanupInterval: NodeJS.Timeout;
  private readonly defaultLimit = 60; // requests per minute

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up old entries every minute
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip rate limiting for health checks
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }

    const limit = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60', 10);
    const windowMs = 60000; // 1 minute

    const clientId = this.getClientId(req);
    const now = Date.now();

    if (!this.store[clientId]) {
      this.store[clientId] = { count: 0, resetTime: now + windowMs };
    }

    const client = this.store[clientId];

    if (now > client.resetTime) {
      client.count = 0;
      client.resetTime = now + windowMs;
    }

    client.count++;

    const remaining = limit - client.count;
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    res.setHeader('X-RateLimit-Reset', Math.ceil(client.resetTime / 1000));

    if (client.count > limit) {
      res.setHeader('Retry-After', Math.ceil((client.resetTime - now) / 1000));
      this.logger.warn(`Rate limit exceeded for ${clientId}. Limit: ${limit}, Current: ${client.count}`);
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }

  private getClientId(req: Request): string {
    // Use user ID if authenticated, otherwise IP address
    const user = (req as any).user;
    return user ? `user_${user.id}` : `ip_${req.ip || req.socket.remoteAddress}`;
  }

  private cleanup() {
    const now = Date.now();
    for (const clientId in this.store) {
      if (this.store[clientId].resetTime <= now) {
        delete this.store[clientId];
      }
    }
  }
}




