import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Generate or use existing request ID
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Add to request object for use in controllers/services
    (req as any).requestId = requestId;

    // Add to response headers
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}

