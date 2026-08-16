import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaystackService } from './paystack.service';

describe('PaystackService', () => {
  let service: PaystackService;
  let configGet: jest.Mock;

  beforeEach(async () => {
    configGet = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaystackService,
        {
          provide: ConfigService,
          useValue: { get: configGet },
        },
      ],
    }).compile();

    service = module.get<PaystackService>(PaystackService);
  });

  describe('verifyWebhookSignature', () => {
    const secret = 'whsec_test_secret';

    beforeEach(() => {
      configGet.mockImplementation((key: string) => (key === 'PAYSTACK_WEBHOOK_SECRET' ? secret : undefined));
    });

    it('returns true when signature matches payload hash', async () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { id: 1 } });
      const crypto = require('crypto');
      const expectedSig = crypto.createHmac('sha512', secret).update(payload).digest('hex');
      const result = await service.verifyWebhookSignature(payload, expectedSig);
      expect(result).toBe(true);
    });

    it('returns false when signature does not match', async () => {
      const payload = '{"event":"charge.success"}';
      const result = await service.verifyWebhookSignature(payload, 'wrong-signature');
      expect(result).toBe(false);
    });

    it('returns false when webhook secret is missing', () => {
      configGet.mockImplementation(() => undefined);
      const result = service.verifyWebhookSignature('{}', 'sig');
      expect(result).toBe(false);
    });

    it('falls back to PAYSTACK_SECRET_KEY when webhook secret is unset', () => {
      const sk = 'sk_test_fallback';
      configGet.mockImplementation((key: string) =>
        key === 'PAYSTACK_SECRET_KEY' ? sk : undefined,
      );
      const payload = '{"event":"charge.success"}';
      const crypto = require('crypto');
      const expectedSig = crypto.createHmac('sha512', sk).update(payload).digest('hex');
      expect(service.verifyWebhookSignature(payload, expectedSig)).toBe(true);
    });
  });
});
