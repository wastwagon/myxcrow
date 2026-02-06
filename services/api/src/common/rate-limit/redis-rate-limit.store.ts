import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { IRateLimitStore, RateLimitResult } from './rate-limit-store.interface';

const KEY_PREFIX = 'rl:';

@Injectable()
export class RedisRateLimitStore implements IRateLimitStore, OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisRateLimitStore.name);

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('RedisRateLimitStore requires REDIS_URL');
    }
    this.client = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
    this.client.on('error', (err) => this.logger.warn('Redis rate-limit client error', err));
  }

  async increment(clientId: string, windowMs: number): Promise<RateLimitResult> {
    try {
      const key = KEY_PREFIX + clientId;
      const windowSec = Math.ceil(windowMs / 1000);
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, windowSec);
      multi.pttl(key);
      const results = await multi.exec();
      if (!results || results.length < 3) {
        return { count: 1, resetTime: Date.now() + windowMs };
      }
      const count = Number((results[0] as [Error | null, string])[1]) || 1;
      const pttl = Number((results[2] as [Error | null, number])[1]) || windowMs;
      const resetTime = Date.now() + (pttl > 0 ? pttl : windowMs);
      return { count, resetTime };
    } catch (err: any) {
      this.logger.warn(`Redis rate-limit increment failed (allowing request): ${err?.message}`);
      return { count: 1, resetTime: Date.now() + windowMs };
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
