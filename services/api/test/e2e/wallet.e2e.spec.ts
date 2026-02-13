/**
 * Wallet E2E: Get wallet, funding history
 * Requires: DATABASE_URL, migrated DB, and seed data (buyer1@test.com, password: password123)
 * Run: pnpm seed && pnpm test:e2e -- wallet.e2e
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import { SMSService } from '../../src/modules/notifications/sms.service';

const SEED_BUYER = { email: 'buyer1@test.com', password: 'password123' };

describe('Wallet E2E Tests', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const mockSms: Partial<SMSService> = {
      sendVerificationOtpSms: async () => ({ success: true }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SMSService)
      .useValue(mockSms)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Login with seed user', () => {
    it('should login as buyer', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          identifier: SEED_BUYER.email,
          password: SEED_BUYER.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          accessToken = res.body.accessToken;
        });
    });
  });

  describe('Get wallet', () => {
    it('should return wallet with balance', () => {
      return request(app.getHttpServer())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('userId');
          expect(res.body).toHaveProperty('currency', 'GHS');
          expect(res.body).toHaveProperty('availableCents');
          expect(res.body).toHaveProperty('pendingCents');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).get('/api/wallet').expect(401);
    });
  });

  describe('Funding history', () => {
    it('should return funding history', () => {
      return request(app.getHttpServer())
        .get('/api/wallet/funding-history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Transactions', () => {
    it('should return wallet transactions', () => {
      return request(app.getHttpServer())
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
