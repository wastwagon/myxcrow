import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface ScreeningResult {
  userId: string;
  screenedAt: Date;
  status: 'CLEAR' | 'MATCH' | 'PENDING' | 'ERROR';
  matches: SanctionsMatch[];
  allowListed: boolean;
  denyListed: boolean;
}

export interface SanctionsMatch {
  list: string; // 'UN', 'EU', 'OFAC', etc.
  name: string;
  matchScore: number;
  details?: any;
}

@Injectable()
export class SanctionsScreeningService {
  private readonly logger = new Logger(SanctionsScreeningService.name);
  private allowList: Set<string> = new Set();
  private denyList: Set<string> = new Set();

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Screen a user against sanctions and PEP lists
   */
  async screenUser(userId: string): Promise<ScreeningResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check allow/deny lists first
    if (this.allowList.has(userId)) {
      return {
        userId,
        screenedAt: new Date(),
        status: 'CLEAR',
        matches: [],
        allowListed: true,
        denyListed: false,
      };
    }

    if (this.denyList.has(userId)) {
      await this.auditService.log({
        userId,
        action: 'sanctions_screening_denied',
        resource: 'user',
        resourceId: userId,
        details: { reason: 'User on deny list' },
      });

      return {
        userId,
        screenedAt: new Date(),
        status: 'MATCH',
        matches: [{ list: 'DENY_LIST', name: 'Deny List', matchScore: 100 }],
        allowListed: false,
        denyListed: true,
      };
    }

    // Perform screening (in production, integrate with external screening service)
    const matches = await this.performScreening(user);

    const result: ScreeningResult = {
      userId,
      screenedAt: new Date(),
      status: matches.length > 0 ? 'MATCH' : 'CLEAR',
      matches,
      allowListed: false,
      denyListed: false,
    };

    // Log screening result
    await this.auditService.log({
      userId,
      action: 'sanctions_screening',
      resource: 'user',
      resourceId: userId,
      details: {
        status: result.status,
        matches: matches.length,
        allowListed: result.allowListed,
        denyListed: result.denyListed,
      },
    });

    // Store screening result
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        // In production, store in a dedicated screening_results table
      },
    });

    return result;
  }

  /**
   * Perform actual screening (placeholder for external service integration)
   */
  private async performScreening(user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<SanctionsMatch[]> {
    // In production, integrate with:
    // - World-Check, Dow Jones, or similar screening service
    // - UN sanctions lists
    // - OFAC SDN list
    // - EU sanctions lists
    // - PEP databases

    // For now, return empty (no matches)
    // This is a placeholder that would call external APIs
    const matches: SanctionsMatch[] = [];

    // Example: Basic name matching (very simplified)
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
    
    // In production, this would be a real screening API call
    // const screeningResult = await externalScreeningService.check({
    //   name: fullName,
    //   email: user.email,
    //   phone: user.phone,
    // });

    return matches;
  }

  /**
   * Add user to allow list
   */
  async addToAllowList(userId: string, reason: string, adminId: string) {
    this.allowList.add(userId);
    
    await this.auditService.log({
      userId: adminId,
      action: 'sanctions_allowlist_add',
      resource: 'user',
      resourceId: userId,
      details: { reason },
    });

    this.logger.log(`User ${userId} added to allow list: ${reason}`);
  }

  /**
   * Add user to deny list
   */
  async addToDenyList(userId: string, reason: string, adminId: string) {
    this.denyList.add(userId);
    
    await this.auditService.log({
      userId: adminId,
      action: 'sanctions_denylist_add',
      resource: 'user',
      resourceId: userId,
      details: { reason },
    });

    this.logger.log(`User ${userId} added to deny list: ${reason}`);
  }

  /**
   * Remove user from allow/deny list
   */
  async removeFromList(userId: string, listType: 'allow' | 'deny', adminId: string) {
    if (listType === 'allow') {
      this.allowList.delete(userId);
    } else {
      this.denyList.delete(userId);
    }

    await this.auditService.log({
      userId: adminId,
      action: `sanctions_${listType}list_remove`,
      resource: 'user',
      resourceId: userId,
    });

    this.logger.log(`User ${userId} removed from ${listType} list`);
  }
}




