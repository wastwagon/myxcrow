import { Injectable, UnauthorizedException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { UserRole, KYCStatus } from '@prisma/client';
import { KYCService } from '../kyc/kyc.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
    @Inject(forwardRef(() => KYCService))
    private kycService?: KYCService,
  ) {}

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

    // Process KYC with face matching if files provided
    let faceMatchResult = null;
    if (files?.cardFront && files?.cardBack && files?.selfie) {
      if (!this.kycService) {
        throw new BadRequestException('KYC service not available. Please contact support.');
      }
      try {
        faceMatchResult = await this.kycService.processKYCRegistration({
          userId: user.id,
          ghanaCardNumber: data.ghanaCardNumber,
          cardFrontBuffer: files.cardFront,
          cardBackBuffer: files.cardBack,
          selfieBuffer: files.selfie,
        });

        // If face match failed, throw error to prevent registration
        if (!faceMatchResult.faceMatchPassed) {
          // Delete user since registration failed
          await this.prisma.user.delete({ where: { id: user.id } });
          throw new BadRequestException(
            `Face verification failed. Similarity score: ${(faceMatchResult.faceMatchScore * 100).toFixed(1)}%. ` +
              'Please ensure your selfie clearly shows your face and matches your Ghana Card photo. ' +
              'Requirements: Good lighting, clear face, similar angle to card photo.',
          );
        }
      } catch (error) {
        // Clean up user if KYC processing fails
        await this.prisma.user.delete({ where: { id: user.id } }).catch(() => {});
        throw error;
      }
    } else if (data.ghanaCardNumber) {
      // Store card number only if no files (backward compatibility)
      await this.prisma.kYCDetail.create({
        data: {
          userId: user.id,
          documentType: 'GHANA_CARD',
          ghanaCardNumber: data.ghanaCardNumber,
        },
      });
    }

    await this.auditService.log({
      userId: user.id,
      action: 'user_register',
      resource: 'user',
      resourceId: user.id,
      details: { email: user.email, faceMatchScore: faceMatchResult?.faceMatchScore },
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
}

