import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IRateLimitStore } from './rate-limit-store.interface';
import { InMemoryRateLimitStore } from './in-memory-rate-limit.store';
import { RedisRateLimitStore } from './redis-rate-limit.store';
import { SimpleRateLimitMiddleware } from '../middleware/simple-rate-limit.middleware';
import { RATE_LIMIT_STORE } from './rate-limit.constants';

@Module({})
export class RateLimitModule {
  static forRoot(): DynamicModule {
    return {
      module: RateLimitModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: RATE_LIMIT_STORE,
          useFactory: (configService: ConfigService): IRateLimitStore => {
            const redisUrl = configService.get<string>('REDIS_URL');
            if (redisUrl && redisUrl.startsWith('redis')) {
              return new RedisRateLimitStore(configService);
            }
            return new InMemoryRateLimitStore();
          },
          inject: [ConfigService],
        },
        SimpleRateLimitMiddleware,
      ],
      exports: [RATE_LIMIT_STORE, SimpleRateLimitMiddleware],
    };
  }
}
