import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { ServerOptions, Server } from 'socket.io';
import { getAllowedOrigins } from '../http/allowed-origins';

export class ChatIoAdapter extends IoAdapter {
  constructor(private readonly app: INestApplication) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const corsOrigins = getAllowedOrigins();
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
        credentials: true,
      },
      pingInterval: 25000,
      pingTimeout: 20000,
      transports: ['websocket', 'polling'],
    });

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const pub = new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
        const sub = new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
        Promise.all([pub.connect(), sub.connect()])
          .then(() => {
            server.adapter(createAdapter(pub, sub));
          })
          .catch(() => {
            /* single-instance fallback */
          });
      } catch {
        /* keep in-memory adapter */
      }
    }

    return server;
  }
}
