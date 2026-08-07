import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PartnerReleasePolicy, PlatformEnvironment, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformsService } from './platforms.service';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Controller('admin/platforms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PlatformsAdminController {
  constructor(
    private readonly platforms: PlatformsService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  @Get()
  list() {
    return this.platforms.list();
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      slug: string;
      releasePolicy?: PartnerReleasePolicy;
      successUrlAllowlist?: string[];
      cancelUrlAllowlist?: string[];
      feePercentageOverride?: number;
      createLiveKey?: boolean;
    },
  ) {
    return this.platforms.createPlatform(body).then(async (platform) => {
      if (body.createLiveKey === false) return { platform };
      const key = await this.apiKeys.createKey({
        platformId: platform.id,
        environment: PlatformEnvironment.LIVE,
        name: 'Initial live secret',
      });
      return { platform, apiKey: key };
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.platforms.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      isActive?: boolean;
      releasePolicy?: PartnerReleasePolicy;
      successUrlAllowlist?: string[];
      cancelUrlAllowlist?: string[];
      feePercentageOverride?: number | null;
    },
  ) {
    return this.platforms.updatePlatform(id, body);
  }

  @Get(':id/api-keys')
  listKeys(@Param('id') id: string) {
    return this.apiKeys.listKeys(id);
  }

  @Post(':id/api-keys')
  createKey(
    @Param('id') id: string,
    @Body()
    body: {
      environment?: PlatformEnvironment;
      name?: string;
      keyType?: 'secret' | 'publishable' | 'restricted';
      scopes?: string[];
    },
  ) {
    return this.apiKeys.createKey({
      platformId: id,
      environment: body.environment ?? PlatformEnvironment.LIVE,
      name: body.name,
      keyType: body.keyType,
      scopes: body.scopes,
    });
  }

  @Post(':id/api-keys/:keyId/revoke')
  revoke(@Param('id') id: string, @Param('keyId') keyId: string) {
    return this.apiKeys.revokeKey(id, keyId);
  }
}
