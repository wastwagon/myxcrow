import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PIIMasker } from '../../common/utils/pii-masker';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    beforeState?: any;
    afterState?: any;
  }) {
    // Mask PII in details, beforeState, and afterState
    const maskedDetails = this.maskPII(data.details);
    const maskedBeforeState = this.maskPII(data.beforeState);
    const maskedAfterState = this.maskPII(data.afterState);

    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: maskedDetails as any,
        ipAddress: data.ipAddress, // IP can be logged but consider masking last octet
        userAgent: data.userAgent,
        beforeState: maskedBeforeState as any,
        afterState: maskedAfterState as any,
      },
    });
  }

  /**
   * Recursively mask PII in objects
   */
  private maskPII(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskPII(item));
    }

    const masked: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (lowerKey.includes('email') && typeof value === 'string') {
        masked[key] = PIIMasker.maskEmail(value);
      } else if (lowerKey.includes('phone') && typeof value === 'string') {
        masked[key] = PIIMasker.maskPhone(value);
      } else if ((lowerKey.includes('firstname') || lowerKey.includes('lastname')) && typeof value === 'string') {
        masked[key] = PIIMasker.maskString(value, 3);
      } else if (lowerKey.includes('account') && lowerKey.includes('number') && typeof value === 'string') {
        masked[key] = PIIMasker.maskAccountNumber(value);
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskPII(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  async getAuditLogs(filters?: {
    userId?: string;
    resource?: string;
    resourceId?: string;
    action?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.resource) where.resource = filters.resource;
    if (filters?.resourceId) where.resourceId = filters.resourceId;
    if (filters?.action) where.action = filters.action;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }
}

