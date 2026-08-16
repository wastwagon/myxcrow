import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  PartnerReleasePolicy,
  PlatformEnvironment,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class PlatformsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  async createPlatform(data: {
    name: string;
    slug: string;
    releasePolicy?: PartnerReleasePolicy;
    successUrlAllowlist?: string[];
    cancelUrlAllowlist?: string[];
    feePercentageOverride?: number;
    metadata?: Prisma.InputJsonValue;
  }) {
    const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!slug) throw new BadRequestException('Invalid slug');
    try {
      return await this.prisma.platformAccount.create({
        data: {
          name: data.name.trim(),
          slug,
          releasePolicy: data.releasePolicy ?? PartnerReleasePolicy.PLATFORM_RELEASE,
          successUrlAllowlist: data.successUrlAllowlist ?? [],
          cancelUrlAllowlist: data.cancelUrlAllowlist ?? [],
          feePercentageOverride: data.feePercentageOverride,
          metadata: data.metadata,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Platform slug already exists');
      throw e;
    }
  }

  async getBySlug(slug: string) {
    const platform = await this.prisma.platformAccount.findUnique({ where: { slug } });
    if (!platform) throw new NotFoundException('Platform not found');
    return platform;
  }

  async getById(id: string) {
    const platform = await this.prisma.platformAccount.findUnique({ where: { id } });
    if (!platform) throw new NotFoundException('Platform not found');
    return platform;
  }

  async list() {
    return this.prisma.platformAccount.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updatePlatform(
    id: string,
    data: {
      name?: string;
      isActive?: boolean;
      releasePolicy?: PartnerReleasePolicy;
      successUrlAllowlist?: string[];
      cancelUrlAllowlist?: string[];
      feePercentageOverride?: number | null;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    await this.getById(id);
    return this.prisma.platformAccount.update({
      where: { id },
      data: {
        name: data.name,
        isActive: data.isActive,
        releasePolicy: data.releasePolicy,
        successUrlAllowlist: data.successUrlAllowlist,
        cancelUrlAllowlist: data.cancelUrlAllowlist,
        feePercentageOverride: data.feePercentageOverride,
        metadata: data.metadata,
      },
    });
  }

  assertUrlAllowed(allowlist: string[], url: string, kind: 'success' | 'cancel') {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException(`Invalid ${kind} URL`);
    }
    if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
      throw new BadRequestException(`${kind} URL must be HTTPS in production`);
    }
    if (!allowlist.length) {
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException(`${kind} URL allowlist is not configured for this platform`);
      }
      return;
    }
    const ok = allowlist.some((prefix) => url.startsWith(prefix));
    if (!ok) {
      throw new BadRequestException(`${kind} URL is not in platform allowlist`);
    }
  }

  async linkMerchant(params: {
    platformId: string;
    externalMerchantId: string;
    sellerEmail?: string;
    sellerPhone?: string;
    sellerUserId?: string;
    businessName?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    let userId = params.sellerUserId;
    if (!userId && params.sellerEmail) {
      const user = await this.prisma.user.findUnique({
        where: { email: params.sellerEmail.trim().toLowerCase() },
      });
      if (!user) {
        throw new NotFoundException(
          `Seller not found with email ${params.sellerEmail}. They must register and complete KYC on MYXCROW first.`,
        );
      }
      userId = user.id;
    }
    if (!userId && params.sellerPhone) {
      const phone = params.sellerPhone.replace(/\D/g, '');
      const normalized = phone.startsWith('233') ? `0${phone.slice(3)}` : phone;
      const user = await this.prisma.user.findFirst({ where: { phone: normalized } });
      if (!user) {
        throw new NotFoundException(
          `Seller not found with phone ${params.sellerPhone}. They must register on MYXCROW first.`,
        );
      }
      userId = user.id;
    }
    if (!userId) {
      throw new BadRequestException('Provide sellerEmail, sellerPhone, or sellerUserId');
    }

    return this.prisma.platformMerchantLink.upsert({
      where: {
        platformId_externalMerchantId: {
          platformId: params.platformId,
          externalMerchantId: params.externalMerchantId,
        },
      },
      create: {
        platformId: params.platformId,
        externalMerchantId: params.externalMerchantId,
        userId,
        businessName: params.businessName,
        metadata: params.metadata,
      },
      update: {
        userId,
        businessName: params.businessName,
        metadata: params.metadata,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            kycStatus: true,
            roles: true,
          },
        },
      },
    });
  }

  async getMerchant(platformId: string, externalMerchantId: string) {
    const link = await this.prisma.platformMerchantLink.findUnique({
      where: {
        platformId_externalMerchantId: { platformId, externalMerchantId },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            kycStatus: true,
            roles: true,
            wallet: {
              select: {
                availableCents: true,
                pendingCents: true,
                currency: true,
              },
            },
          },
        },
      },
    });
    if (!link || !link.isActive) throw new NotFoundException('Merchant link not found');
    return link;
  }

  async createBootstrapKey(
    platformId: string,
    environment: PlatformEnvironment = PlatformEnvironment.LIVE,
  ) {
    return this.apiKeys.createKey({
      platformId,
      environment,
      name: 'Default secret key',
      keyType: 'secret',
    });
  }
}
