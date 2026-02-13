import { Injectable, UnauthorizedException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { UserRole, KYCStatus } from '@prisma/client';
import { KYCService } from '../kyc/kyc.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
    private emailService: EmailService,
    private configService: ConfigService,
    @Inject(forwardRef(() => KYCService))
    private kycService?: KYCService,
  ) { }

  async register(
    data: RegisterDto,
    files?: {
      cardFront?: Buffer;
      cardBack?: Buffer;
      selfie?: Buffer;
    },
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Check if phone number already exists
    if (data.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: data.phone },
      });
      if (existingPhone) {
        throw new BadRequestException('Phone number already registered');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        roles: data.role ? [data.role] : [UserRole.BUYER],
        kycStatus: KYCStatus.PENDING, // Will be updated after KYC processing
        isActive: true, // Ensure new users are active
      },
    });

    // Process KYC documents if provided (optional for MVP)
    let kycResult = null;
    if (files?.cardFront && files?.cardBack && files?.selfie) {
      if (!this.kycService) {
        throw new BadRequestException('KYC service not available. Please contact support.');
      }
      try {
        kycResult = await this.kycService.processKYCRegistration({
          userId: user.id,
          ghanaCardNumber: undefined, // No Ghana Card number collected
          cardFrontBuffer: files.cardFront,
          cardBackBuffer: files.cardBack,
          selfieBuffer: files.selfie,
        });

        // We no longer block registration on face matching.
        // All submissions go to PENDING for admin review.
      } catch (error) {
        // Clean up user if KYC processing fails (e.g. upload error)
        await this.prisma.user.delete({ where: { id: user.id } }).catch(() => { });
        throw error;
      }
    }

    await this.auditService.log({
      userId: user.id,
      action: 'user_register',
      resource: 'user',
      resourceId: user.id,
      details: { email: user.email, kycSubmitted: !!kycResult },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        roles: user.roles,
        kycStatus: user.kycStatus,
      },
      ...tokens,
    };
  }

  async login(data: LoginDto) {
    const user = await this.validateUser(data.email, data.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    await this.auditService.log({
      userId: user.id,
      action: 'user_login',
      resource: 'user',
      resourceId: user.id,
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        roles: user.roles,
        kycStatus: user.kycStatus,
      },
      ...tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string }) {
    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'update_profile',
      resource: 'user',
      resourceId: userId,
      details: updateData,
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Validate new password strength
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }

    // Get user with password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      await this.auditService.log({
        userId: user.id,
        action: 'change_password_failed',
        resource: 'user',
        resourceId: user.id,
        details: { reason: 'Invalid current password' },
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Log successful password change
    await this.auditService.log({
      userId: user.id,
      action: 'change_password',
      resource: 'user',
      resourceId: user.id,
      details: { success: true },
    });

    // Send email notification
    try {
      await this.emailService.sendEmail(
        user.email,
        'Password Changed Successfully',
        `
          <h2>Password Changed</h2>
          <p>Your MYXCROW account password has been changed successfully.</p>
          <p>If you did not make this change, please contact support immediately.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        `
      );
    } catch (error) {
      // Don't fail the request if email fails
      console.error('Failed to send password change email:', error);
    }

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        roles: true,
        kycStatus: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    await this.auditService.log({
      userId,
      action: 'get_profile',
      resource: 'user',
      resourceId: userId,
    });

    return user;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async requestPasswordReset(email: string) {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) {
      return { success: true };
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, isActive: true },
    });

    // Always return success to avoid account enumeration
    if (!user || !user.isActive) {
      return { success: true };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const webBase =
      this.configService.get<string>('WEB_BASE_URL') ||
      this.configService.get<string>('WEB_APP_URL') ||
      'http://localhost:3003';

    const resetLink = `${webBase.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;

    const html = `
      <h2>Reset your MYXCROW password</h2>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link expires in 1 hour.</p>
    `;

    await this.emailService.sendEmail(user.email, 'Reset your MYXCROW password', html);

    await this.auditService.log({
      userId: user.id,
      action: 'password_reset_requested',
      resource: 'user',
      resourceId: user.id,
      details: { email: user.email },
    });

    return { success: true };
  }

  async adminImpersonate(adminUserId: string, targetUserId: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { id: true, roles: true },
    });

    if (!admin || !admin.roles.includes(UserRole.ADMIN)) {
      throw new UnauthorizedException('Only admins can impersonate users');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        kycStatus: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    if (!targetUser.isActive) {
      throw new BadRequestException('Cannot impersonate inactive user');
    }

    if (targetUser.roles.includes(UserRole.ADMIN)) {
      throw new BadRequestException('Cannot impersonate another admin');
    }

    await this.auditService.log({
      userId: adminUserId,
      action: 'admin_impersonate',
      resource: 'user',
      resourceId: targetUserId,
      details: {
        adminEmail: (await this.prisma.user.findUnique({ where: { id: adminUserId }, select: { email: true } }))?.email,
        targetEmail: targetUser.email,
      },
    });

    const tokens = await this.generateTokens(targetUser.id, targetUser.email);

    return {
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName || undefined,
        lastName: targetUser.lastName || undefined,
        roles: targetUser.roles,
        kycStatus: targetUser.kycStatus,
      },
      ...tokens,
    };
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    const rawToken = (token || '').trim();
    if (!rawToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
      // Best-effort: invalidate other unused tokens for this user
      this.prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.auditService.log({
      userId: record.userId,
      action: 'password_reset_confirmed',
      resource: 'user',
      resourceId: record.userId,
    });

    return { success: true };
  }
}

