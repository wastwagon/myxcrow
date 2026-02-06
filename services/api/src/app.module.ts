import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './modules/prisma/prisma.service';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { EmailModule } from './modules/email/email.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { AutomationModule } from './modules/automation/automation.module';
import { RiskModule } from './modules/risk/risk.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { KYCModule } from './modules/kyc/kyc.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { SecretsModule } from './common/secrets/secrets.module';
import { QueueModule } from './common/queue/queue.module';
import { SecurityModule } from './common/security/security.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { SimpleRateLimitMiddleware } from './common/middleware/simple-rate-limit.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import paystackConfig from './config/paystack.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [paystackConfig],
    }),
    ScheduleModule.forRoot(), // For cron jobs (auto-release)
    CryptoModule, // Global encryption service
    SecretsModule, // Global secrets management
    QueueModule, // Global queue system
    SecurityModule, // Global security services (antivirus)
    RateLimitModule.forRoot(),
    AuthModule,
    EscrowModule,
    PaymentsModule,
    WalletModule,
    EvidenceModule,
    DisputesModule,
    LedgerModule,
    EmailModule,
    SettingsModule,
    AuditModule,
    UsersModule,
    AdminModule,
    AutomationModule,
    RiskModule,
    ComplianceModule,
    ReputationModule,
    KYCModule,
    DeliveryModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Order matters: Request ID first, then CSRF, then rate limiting
    consumer
      .apply(RequestIdMiddleware, CsrfMiddleware, SimpleRateLimitMiddleware)
      .forRoutes('*');
  }
}

