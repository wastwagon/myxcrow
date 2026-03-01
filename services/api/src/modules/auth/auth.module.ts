import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { AuditModule } from '../audit/audit.module';
import { RolesGuard } from './guards/roles.guard';
import { EmailModule } from '../email/email.module';
import { SMSModule } from '../notifications/sms.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret || /change-in-production|your-secret-key|your-super-secret/i.test(secret)) {
          throw new Error('JWT_SECRET must be set to a secure value in production. Generate with: openssl rand -base64 32');
        }
        return { secret, signOptions: { expiresIn: '7d' } };
      },
      inject: [ConfigService],
    }),
    forwardRef(() => AuditModule),
    forwardRef(() => EmailModule),
    SMSModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, PrismaService, RolesGuard],
  exports: [AuthService],
})
export class AuthModule {}

