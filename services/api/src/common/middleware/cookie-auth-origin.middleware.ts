import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ACCESS_COOKIE, REFRESH_COOKIE, parseCookieHeader } from '../../modules/auth/auth-cookies';
import { isAllowedOrigin } from '../http/allowed-origins';

/**
 * When auth is cookie-based (no Bearer header), mutating requests must come from
 * an allowed Origin. SameSite=None deployments would otherwise be CSRF-able.
 */
@Injectable()
export class CookieAuthOriginMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const method = (req.method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return next();
    }

    const auth = req.headers.authorization;
    if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
      return next();
    }

    const cookies = parseCookieHeader(req.headers.cookie);
    if (!cookies[ACCESS_COOKIE] && !cookies[REFRESH_COOKIE]) {
      return next();
    }

    const origin = (req.headers.origin as string | undefined) || '';
    const referer = (req.headers.referer as string | undefined) || '';
    const candidate = origin || (referer ? originFromReferer(referer) : '');
    if (!candidate || !isAllowedOrigin(candidate)) {
      throw new HttpException('Invalid request origin', HttpStatus.FORBIDDEN);
    }
    next();
  }
}

function originFromReferer(referer: string): string {
  try {
    return new URL(referer).origin;
  } catch {
    return '';
  }
}
