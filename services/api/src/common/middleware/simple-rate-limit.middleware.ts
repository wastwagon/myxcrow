import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IRateLimitStore } from '../rate-limit/rate-limit-store.interface';
import { RATE_LIMIT_STORE } from '../rate-limit/rate-limit.constants';

@Injectable()
export class SimpleRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SimpleRateLimitMiddleware.name);

  constructor(@Inject(RATE_LIMIT_STORE) private readonly store: IRateLimitStore) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = (req.path || req.originalUrl?.split('?')[0] || '').toLowerCase();
    const isHealthCheck =
      path === 'health' ||
      path === '/health' ||
      path === '/api/health' ||
      path.endsWith('/health') ||
      path.startsWith('/api/health') ||
      path.startsWith('/health/');
    if (isHealthCheck) {
      return next();
    }

    const limit = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60', 10);
    const windowMs = 60000;

    const clientId = this.getClientId(req);
    const { count, resetTime } = await this.store.increment(clientId, windowMs);

    const remaining = limit - count;
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

    if (count > limit) {
      res.setHeader('Retry-After', Math.ceil((resetTime - Date.now()) / 1000));
      this.logger.warn(`Rate limit exceeded for ${clientId}. Limit: ${limit}, Current: ${count}`);
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }

  private getClientId(req: Request): string {
    const user = (req as any).user;
    return user ? `user_${user.id}` : `ip_${req.ip || req.socket.remoteAddress}`;
  }
}
