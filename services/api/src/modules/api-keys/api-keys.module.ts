import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ApiKeysService, PrismaService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
