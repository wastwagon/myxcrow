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
    
    // Skip rate limiting for health checks
    if (isHealthCheck) {
      return next();
    }

    // Skip rate limiting for internal/private IPs (Render's health checks, internal services)
    const clientIp = req.ip || req.socket.remoteAddress || '';
    if (this.isInternalIp(clientIp)) {
      return next();
    }

    // Stricter limits for auth endpoints (brute-force protection)
    let limit: number;
    let windowMs: number;
    let clientId: string;

    const pathNorm = path.replace(/\/$/, '');
    if (pathNorm === '/api/auth/send-phone-otp') {
      limit = parseInt(process.env.RATE_LIMIT_OTP_PER_IP || '3', 10);
      windowMs = 15 * 60 * 1000; // 15 minutes
      clientId = `otp_ip_${req.ip || req.socket.remoteAddress}`;
    } else if (pathNorm === '/api/auth/login') {
      limit = parseInt(process.env.RATE_LIMIT_LOGIN_PER_IP || '5', 10);
      windowMs = 15 * 60 * 1000; // 15 minutes
      clientId = `login_ip_${req.ip || req.socket.remoteAddress}`;
    } else if (pathNorm === '/api/auth/register') {
      limit = parseInt(process.env.RATE_LIMIT_REGISTER_PER_IP || '3', 10);
      windowMs = 60 * 60 * 1000; // 1 hour
      clientId = `register_ip_${req.ip || req.socket.remoteAddress}`;
    } else {
      limit = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60', 10);
      windowMs = 60000;
      clientId = this.getClientId(req);
    }
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

  /**
   * Check if an IP address is internal/private
   * Internal IPs include:
   * - 10.0.0.0/8 (Render, AWS, etc.)
   * - 172.16.0.0/12 (Docker, private networks)
   * - 192.168.0.0/16 (Local networks)
   * - 127.0.0.0/8 (Localhost)
   */
  private isInternalIp(ip: string): boolean {
    if (!ip) return false;

    // Extract IPv4 address from IPv6-mapped IPv4 (::ffff:10.x.x.x)
    const ipv4Match = ip.match(/(?:::ffff:)?(\d+\.\d+\.\d+\.\d+)/);
    if (!ipv4Match) return false;

    const cleanIp = ipv4Match[1];
    const parts = cleanIp.split('.').map(Number);

    if (parts.length !== 4) return false;

    // 10.0.0.0/8 (Render internal, AWS VPC, etc.)
    if (parts[0] === 10) return true;

    // 172.16.0.0/12 (Docker, private networks)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16 (Local networks)
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 127.0.0.0/8 (Localhost)
    if (parts[0] === 127) return true;

    return false;
  }

  private getClientId(req: Request): string {
    const user = (req as any).user;
    return user ? `user_${user.id}` : `ip_${req.ip || req.socket.remoteAddress}`;
  }
}
