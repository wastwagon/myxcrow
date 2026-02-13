import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import { SMSService } from '../../src/modules/notifications/sms.service';

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  let accessToken: string;
  const otpByPhone: Record<string, string> = {};
  const testPhone = `055${String(1000000 + (Date.now() % 8999999)).slice(-7)}`;
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: testPhone,
  };

  beforeAll(async () => {
    const mockSms: Partial<SMSService> = {
      sendVerificationOtpSms: async (phone: string, code: string) => {
        otpByPhone[phone] = code;
        return { success: true };
      },
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

  describe('/api/auth/send-phone-otp (POST)', () => {
    it('should send OTP for new phone', () => {
      return request(app.getHttpServer())
        .post('/api/auth/send-phone-otp')
        .send({ phone: testPhone })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(otpByPhone[testPhone]).toMatch(/^\d{6}$/);
        });
    });
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user with valid OTP', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...testUser,
          code: otpByPhone[testPhone],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
          accessToken = res.body.accessToken;
        });
    });

    it('should fail with duplicate email', async () => {
      const dupPhone = `055${String(2000000 + (Date.now() % 7999999)).slice(-7)}`;
      await request(app.getHttpServer())
        .post('/api/auth/send-phone-otp')
        .send({ phone: dupPhone })
        .expect(201);
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: testUser.email,
          phone: dupPhone,
          code: otpByPhone[dupPhone],
        })
        .expect(400);
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
          phone: `055${String(1000002 + (Date.now() % 8999997)).slice(-7)}`,
          code: '000000',
        })
        .expect(400);
    });

    it('should fail with weak password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'another@example.com',
          password: 'weak',
          phone: `055${String(1000003 + (Date.now() % 8999996)).slice(-7)}`,
          code: '000000',
        })
        .expect(400);
    });
  });

  describe('/api/auth/send-phone-otp (POST) - after register', () => {
    it('should fail for already registered phone', () => {
      return request(app.getHttpServer())
        .post('/api/auth/send-phone-otp')
        .send({ phone: testPhone })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login with correct credentials (email)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          identifier: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
        });
    });

    it('should fail with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          identifier: testUser.email,
          password: 'wrong-password',
        })
        .expect(401);
    });

    it('should fail with non-existent identifier', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'any-password',
        })
        .expect(401);
    });
  });

  describe('/api/auth/profile (GET)', () => {
    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('firstName', testUser.firstName);
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/api/auth/profile (PUT)', () => {
    it('should update user profile', () => {
      return request(app.getHttpServer())
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toBe('Updated');
          expect(res.body.lastName).toBe('Name');
        });
    });
  });

  describe('/api/auth/change-password (PUT)', () => {
    it('should change password successfully', () => {
      const newPassword = 'NewPassword123!';
      return request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: newPassword,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Password changed successfully');
        });
    });

    it('should fail with incorrect current password', () => {
      return request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrong-password',
          newPassword: 'NewPassword456!',
        })
        .expect(401);
    });

    it('should fail with weak new password', () => {
      return request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'NewPassword123!',
          newPassword: 'weak',
        })
        .expect(400);
    });
  });
});
