/**
 * Escrow E2E: Create → Fund (wallet) → Release
 * Requires: DATABASE_URL, migrated DB, and seed data (buyer1@test.com, seller1@test.com, password: password123)
 * Run: pnpm seed && pnpm test:e2e -- escrow.e2e
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import { SMSService } from '../../src/modules/notifications/sms.service';

const SEED_BUYER = { email: 'buyer1@test.com', password: 'password123' };
const SEED_SELLER = { email: 'seller1@test.com', password: 'password123' };

describe('Escrow E2E Tests', () => {
  let app: INestApplication;
  let buyerToken: string;
  let escrowId: string;

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
          buyerToken = res.body.accessToken;
        });
    });
  });

  describe('Create escrow', () => {
    it('should create escrow with seller by email', () => {
      return request(app.getHttpServer())
        .post('/api/escrows')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          sellerId: SEED_SELLER.email,
          amountCents: 10000,
          currency: 'GHS',
          description: 'E2E Test - Widget Purchase',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.status).toBe('AWAITING_FUNDING');
          expect(res.body.amountCents).toBe(10000);
          escrowId = res.body.id;
        });
    });
  });

  describe('Fund escrow from wallet', () => {
    it('should fund escrow when buyer has balance', () => {
      return request(app.getHttpServer())
        .put(`/api/escrows/${escrowId}/fund`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('FUNDED');
        });
    });

    it('should fail to fund again (idempotent)', () => {
      return request(app.getHttpServer())
        .put(`/api/escrows/${escrowId}/fund`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(400);
    });
  });

  describe('Deliver escrow (auto-releases when autoReleaseDays=0)', () => {
    it('should mark delivered and auto-release funds to seller', () => {
      return request(app.getHttpServer())
        .put(`/api/escrows/${escrowId}/deliver`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200)
        .expect((res) => {
          expect(['DELIVERED', 'RELEASED']).toContain(res.body.status);
        });
    });
  });

  describe('Release escrow (when not auto-released)', () => {
    it('should return 200 if already released, or 400 if invalid', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/escrows/${escrowId}/release`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect([200, 400]).toContain(res.status);
    });
  });
});
