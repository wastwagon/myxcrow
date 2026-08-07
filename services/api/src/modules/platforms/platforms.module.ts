import { Module } from '@nestjs/common';
import { PlatformsService } from './platforms.service';
import { PlatformsAdminController } from './platforms-admin.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ApiKeysModule, AuthModule],
  controllers: [PlatformsAdminController],
  providers: [PlatformsService, PrismaService],
  exports: [PlatformsService],
})
export class PlatformsModule {}
