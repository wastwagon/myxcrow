import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SMSService } from '../notifications/sms.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { KYCService } from '../kyc/kyc.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let auditService: AuditService;
  let emailService: EmailService;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    roles: ['BUYER'],
    kycStatus: 'VERIFIED',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      create: jest.fn(),
    },
    phoneVerificationCode: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockEmailService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordChangedEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const mockKYCService = {
    processKYCRegistration: jest.fn(),
  };

  const mockSMSService = {
    sendVerificationOtpSms: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: KYCService, useValue: mockKYCService },
        { provide: SMSService, useValue: mockSMSService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    auditService = module.get<AuditService>(AuditService);
    emailService = module.get<EmailService>(EmailService);
  });

  describe('login', () => {
    it('should successfully login with correct credentials (email)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login({
        identifier: 'test@example.com',
        password: 'correct-password',
      });

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('correct-password', 'hashed-password');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({
          identifier: 'nonexistent@example.com',
          password: 'any-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login({
          identifier: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.login({
          identifier: 'test@example.com',
          password: 'correct-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const validCodeRecord = {
      id: 'code-id-1',
      phone: '0551234567',
      codeHash: require('crypto').createHash('sha256').update('123456').digest('hex'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    };

    it('should successfully register a new user with valid OTP', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.phoneVerificationCode.findFirst.mockResolvedValue(validCodeRecord);
      mockPrismaService.phoneVerificationCode.update.mockResolvedValue(validCodeRecord);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.wallet.create.mockResolvedValue({ id: 'wallet-id' });
      mockedBcrypt.hash.mockResolvedValue('hashed-new-password' as never);

      const result = await service.register({
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        phone: '0551234567',
        code: '123456',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.phoneVerificationCode.findFirst.mockResolvedValue(validCodeRecord);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          phone: '0551234567',
          code: '123456',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if phone already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.phoneVerificationCode.findFirst.mockResolvedValue(validCodeRecord);

      await expect(
        service.register({
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          phone: '0551234567',
          code: '123456',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should successfully change password with correct current password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('new-hashed-password' as never);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.changePassword('user-id-123', 'current-password', 'NewPassword123!');

      expect(result).toHaveProperty('message', 'Password changed successfully');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        data: { passwordHash: 'new-hashed-password' },
      });
      expect(auditService.log).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordChangedEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException if new password is too short', async () => {
      await expect(service.changePassword('user-id-123', 'current', 'short')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.changePassword('user-id-123', 'wrong-current', 'NewPassword123!'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'change_password_failed',
        }),
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('non-existent-id', 'current', 'NewPassword123!'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-id-123');

      expect(result).toHaveProperty('id', 'user-id-123');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        select: expect.objectContaining({
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }),
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updatedUser = { ...mockUser, firstName: 'Updated', lastName: 'Name' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-id-123', {
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        data: { firstName: 'Updated', lastName: 'Name' },
        select: expect.any(Object),
      });
      expect(auditService.log).toHaveBeenCalled();
    });
  });
});
