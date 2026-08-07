import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PlatformEnvironment, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const ALL_PARTNER_SCOPES = [
  'checkout:write',
  'escrows:read',
  'escrows:write',
  'releases:write',
  'refunds:write',
  'merchants:read',
  'merchants:write',
  'webhooks:manage',
  'disputes:read',
  'wallet:read',
] as const;

export type PartnerScope = (typeof ALL_PARTNER_SCOPES)[number];

export type AuthenticatedPlatformKey = {
  apiKeyId: string;
  platformId: string;
  environment: PlatformEnvironment;
  keyType: string;
  scopes: string[];
  platformSlug: string;
  platformName: string;
  releasePolicy: string;
};

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  private envPrefix(env: PlatformEnvironment): string {
    return env === PlatformEnvironment.SANDBOX ? 'test' : 'live';
  }

  private keyTypePrefix(keyType: string): string {
    if (keyType === 'publishable') return 'pk';
    if (keyType === 'restricted') return 'rk';
    return 'sk';
  }

  /** Generate plaintext secret once; store only hash. */
  async createKey(params: {
    platformId: string;
    environment: PlatformEnvironment;
    name?: string;
    keyType?: 'secret' | 'publishable' | 'restricted';
    scopes?: string[];
  }) {
    const platform = await this.prisma.platformAccount.findUnique({
      where: { id: params.platformId },
    });
    if (!platform || !platform.isActive) {
      throw new NotFoundException('Platform not found or inactive');
    }

    const keyType = params.keyType ?? 'secret';
    const scopes =
      params.scopes?.length
        ? params.scopes
        : keyType === 'publishable'
          ? ['checkout:write']
          : [...ALL_PARTNER_SCOPES];

    const random = randomBytes(24).toString('base64url');
    const keyId = `mx_${this.envPrefix(params.environment)}_${this.keyTypePrefix(keyType)}_${random.slice(0, 12)}`;
    const secretBody = randomBytes(32).toString('base64url');
    const plaintext = `${keyId}.${secretBody}`;
    const secretHash = await bcrypt.hash(plaintext, 12);

    const row = await this.prisma.platformApiKey.create({
      data: {
        platformId: params.platformId,
        environment: params.environment,
        name: params.name,
        keyId,
        secretHash,
        lastFour: plaintext.slice(-4),
        keyType,
        scopes,
      },
    });

    return {
      id: row.id,
      keyId: row.keyId,
      secret: plaintext,
      lastFour: row.lastFour,
      keyType: row.keyType,
      environment: row.environment,
      scopes: row.scopes,
      name: row.name,
      createdAt: row.createdAt,
    };
  }

  async listKeys(platformId: string) {
    return this.prisma.platformApiKey.findMany({
      where: { platformId },
      select: {
        id: true,
        keyId: true,
        lastFour: true,
        keyType: true,
        environment: true,
        scopes: true,
        name: true,
        revokedAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeKey(platformId: string, keyRowId: string) {
    const key = await this.prisma.platformApiKey.findFirst({
      where: { id: keyRowId, platformId },
    });
    if (!key) throw new NotFoundException('API key not found');
    if (key.revokedAt) throw new BadRequestException('API key already revoked');
    return this.prisma.platformApiKey.update({
      where: { id: key.id },
      data: { revokedAt: new Date() },
      select: {
        id: true,
        keyId: true,
        revokedAt: true,
      },
    });
  }

  async authenticateBearer(raw: string): Promise<AuthenticatedPlatformKey | null> {
    const token = raw.trim();
    if (!token.startsWith('mx_')) return null;

    const keyId = token.includes('.') ? token.split('.')[0]! : token;
    const row = await this.prisma.platformApiKey.findUnique({
      where: { keyId },
      include: {
        platform: {
          select: {
            id: true,
            slug: true,
            name: true,
            isActive: true,
            releasePolicy: true,
          },
        },
      },
    });
    if (!row || row.revokedAt || !row.platform.isActive) return null;

    // Accept either full plaintext (keyId.secret) or legacy keyId-only for publishable display (never for secret ops)
    const ok = token.includes('.')
      ? await bcrypt.compare(token, row.secretHash)
      : false;
    if (!ok) return null;

    await this.prisma.platformApiKey.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      apiKeyId: row.id,
      platformId: row.platformId,
      environment: row.environment,
      keyType: row.keyType,
      scopes: row.scopes,
      platformSlug: row.platform.slug,
      platformName: row.platform.name,
      releasePolicy: row.platform.releasePolicy,
    };
  }

  assertScope(auth: AuthenticatedPlatformKey, scope: PartnerScope) {
    if (!auth.scopes.includes(scope) && !auth.scopes.includes('*')) {
      throw new BadRequestException(`API key missing scope: ${scope}`);
    }
    if (auth.keyType === 'publishable' && scope !== 'checkout:write') {
      throw new BadRequestException('Publishable keys may only create checkout sessions');
    }
  }

  hashRequestBody(body: unknown): string {
    return createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');
  }

  async rememberIdempotency(
    platformId: string,
    key: string,
    responseStatus: number,
    responseBody: Prisma.InputJsonValue,
    requestHash?: string,
  ) {
    try {
      await this.prisma.partnerIdempotencyRecord.create({
        data: {
          platformId,
          key,
          requestHash,
          responseStatus,
          responseBody,
        },
      });
    } catch {
      // unique race — ignore
    }
  }

  async getIdempotency(platformId: string, key: string) {
    return this.prisma.partnerIdempotencyRecord.findUnique({
      where: { platformId_key: { platformId, key } },
    });
  }
}
