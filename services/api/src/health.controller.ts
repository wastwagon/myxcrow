import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/readiness')
  async readiness() {
    const checks: Record<string, { status: string; message?: string }> = {};

    // Database connectivity check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'healthy' };
    } catch (error: any) {
      checks.database = {
        status: 'unhealthy',
        message: error.message,
      };
    }

    const allHealthy = Object.values(checks).every((check) => check.status === 'healthy');

    return {
      status: allHealthy ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  @Get('health/liveness')
  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}

