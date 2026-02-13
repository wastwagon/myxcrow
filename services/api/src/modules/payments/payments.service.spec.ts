import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { LedgerHelperService } from './ledger-helper.service';
import { AuditService } from '../audit/audit.service';
import { WalletTopupService } from './wallet-topup.service';
import { EscrowService } from '../escrow/escrow.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: { payment: { findFirst: jest.Mock }; walletFunding: { findFirst: jest.Mock } };
  let walletTopupVerify: jest.Mock;
  let escrowVerify: jest.Mock;

  beforeEach(async () => {
    walletTopupVerify = jest.fn().mockResolvedValue({ status: 'SUCCEEDED' });
    escrowVerify = jest.fn().mockResolvedValue(undefined);

    const mockPrisma = {
      payment: {
        findFirst: jest.fn(),
      },
      walletFunding: {
        findFirst: jest.fn(),
      },
    };
    prisma = mockPrisma as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaystackService, useValue: {} },
        { provide: LedgerHelperService, useValue: {} },
        { provide: AuditService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
        {
          provide: WalletTopupService,
          useValue: { verifyTopUp: walletTopupVerify },
        },
        {
          provide: EscrowService,
          useValue: { fundEscrowFromDirectPayment: escrowVerify },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    (service as any).prisma = mockPrisma;
    (service as any).walletTopupService = { verifyTopUp: walletTopupVerify };
    (service as any).escrowService = { fundEscrowFromDirectPayment: escrowVerify };
  });

  describe('handleWebhook', () => {
    it('returns received when event is not charge.success', async () => {
      const result = await service.handleWebhook('subscription.create', {});
      expect(result).toEqual({ received: true });
      expect(prisma.payment.findFirst).not.toHaveBeenCalled();
    });

    it('returns received when reference is missing', async () => {
      const result = await service.handleWebhook('charge.success', {});
      expect(result).toEqual({ received: true });
      expect(prisma.payment.findFirst).not.toHaveBeenCalled();
    });

    it('skips processing when escrow payment already COMPLETED (idempotent)', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'p1',
        status: 'COMPLETED',
        escrowId: 'e1',
      });
      prisma.walletFunding.findFirst.mockResolvedValue(null);

      const result = await service.handleWebhook('charge.success', { reference: 'ref-123' });

      expect(result).toEqual({ received: true });
      expect(walletTopupVerify).not.toHaveBeenCalled();
      expect(escrowVerify).not.toHaveBeenCalled();
    });

    it('skips processing when wallet funding already SUCCEEDED (idempotent)', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.walletFunding.findFirst.mockResolvedValue({
        id: 'f1',
        status: 'SUCCEEDED',
      });

      const result = await service.handleWebhook('charge.success', { reference: 'ref-456' });

      expect(result).toEqual({ received: true });
      expect(walletTopupVerify).not.toHaveBeenCalled();
    });

    it('calls verifyEscrowFunding when escrow payment is PENDING', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'p1',
        status: 'PENDING',
        escrowId: 'e1',
      });
      prisma.walletFunding.findFirst.mockResolvedValue(null);

      // PaymentsService calls verifyEscrowFunding internally - we need to mock the full flow
      // Since verifyEscrowFunding uses prisma and escrowService, we test via integration
      // For unit test we verify the webhook routes to the right handler
      const verifySpy = jest.spyOn(service as any, 'verifyEscrowFunding').mockResolvedValue({});

      const result = await service.handleWebhook('charge.success', { reference: 'ref-escrow' });

      expect(result).toEqual({ received: true });
      expect(verifySpy).toHaveBeenCalledWith('ref-escrow');
      verifySpy.mockRestore();
    });

    it('calls verifyWalletTopup when wallet funding is PENDING', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.walletFunding.findFirst.mockResolvedValue({
        id: 'f1',
        status: 'PENDING',
      });

      const result = await service.handleWebhook('charge.success', { reference: 'ref-wallet' });

      expect(result).toEqual({ received: true });
      expect(walletTopupVerify).toHaveBeenCalledWith('ref-wallet');
    });
  });
});
