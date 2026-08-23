import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatRealtimeService } from './chat-realtime.service';
import { ChatStorageService } from './chat-storage.service';
import { AntivirusService } from '../../common/security/antivirus.service';
import { UserRole, KYCStatus } from '@prisma/client';
import type { CurrentUser } from '../auth/interfaces/current-user.interface';

const buyer: CurrentUser = {
  id: 'buyer-1',
  email: 'buyer@test.com',
  phone: '0240000000',
  firstName: 'Ama',
  lastName: 'Buyer',
  roles: [UserRole.BUYER],
  kycStatus: KYCStatus.VERIFIED,
  isActive: true,
};

const stranger: CurrentUser = {
  ...buyer,
  id: 'stranger-1',
  email: 'x@test.com',
};

const admin: CurrentUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  phone: '0240000001',
  firstName: 'Ada',
  lastName: 'Admin',
  roles: [UserRole.ADMIN],
  kycStatus: KYCStatus.VERIFIED,
  isActive: true,
};

describe('ChatService', () => {
  let service: ChatService;
  const prisma = {
    escrowAgreement: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    escrowMessage: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
    escrowThreadRead: { upsert: jest.fn() },
    supportConversation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    supportMessage: { findMany: jest.fn(), create: jest.fn() },
    supportThreadRead: { upsert: jest.fn() },
  };
  const realtime = {
    emitToRoom: jest.fn(),
    emitToUser: jest.fn(),
    emitToStaff: jest.fn(),
    escrowRoom: (id: string) => `escrow:${id}`,
    supportRoom: (id: string) => `support:${id}`,
  };
  const storage = { isReady: () => false, putObject: jest.fn(), getUrl: jest.fn() };
  const antivirus = { scanFile: jest.fn().mockResolvedValue({ safe: true }) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: ChatRealtimeService, useValue: realtime },
        { provide: ChatStorageService, useValue: storage },
        { provide: AntivirusService, useValue: antivirus },
      ],
    }).compile();
    service = module.get(ChatService);
  });

  it('blocks a non-participant from escrow chat', async () => {
    prisma.escrowAgreement.findUnique.mockResolvedValue({
      id: 'e1',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      supportJoinedAt: null,
      description: 'Phone',
      status: 'FUNDED',
      buyer: buyer,
      seller: { id: 'seller-1', firstName: 'Kojo', lastName: 'Seller', email: 's@test.com', roles: [] },
    });
    await expect(service.listEscrowMessages('e1', stranger)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets a participant send a message and broadcasts it', async () => {
    prisma.escrowAgreement.findUnique.mockResolvedValue({
      id: 'e1',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      supportJoinedAt: null,
      description: 'Phone',
      status: 'FUNDED',
      buyer: buyer,
      seller: { id: 'seller-1', firstName: 'Kojo', lastName: 'Seller', email: 's@test.com', roles: [] },
    });
    prisma.escrowMessage.create.mockResolvedValue({
      id: 'm1',
      escrowId: 'e1',
      userId: buyer.id,
      content: 'On my way',
      isSystem: false,
      attachmentKey: null,
      attachmentName: null,
      attachmentMime: null,
      createdAt: new Date('2026-08-23T00:00:00Z'),
      user: { ...buyer, roles: [UserRole.BUYER] },
    });
    prisma.escrowAgreement.update.mockResolvedValue({});
    prisma.escrowThreadRead.upsert.mockResolvedValue({});

    const dto = await service.sendEscrowMessage('e1', buyer, 'On my way');
    expect(dto.content).toBe('On my way');
    expect(realtime.emitToRoom).toHaveBeenCalledWith('escrow:e1', 'chat:message', expect.objectContaining({ content: 'On my way' }));
    expect(realtime.emitToUser).toHaveBeenCalledWith('seller-1', 'chat:unread', expect.any(Object));
  });

  it('lets staff join and send on an escrow', async () => {
    prisma.escrowAgreement.findUnique.mockResolvedValue({
      id: 'e1',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      supportJoinedAt: null,
      description: 'Phone',
      status: 'FUNDED',
      buyer: buyer,
      seller: { id: 'seller-1', firstName: 'Kojo', lastName: 'Seller', email: 's@test.com', roles: [] },
    });
    prisma.escrowAgreement.update.mockResolvedValue({});
    prisma.escrowMessage.create.mockResolvedValue({
      id: 'sys',
      escrowId: 'e1',
      userId: null,
      content: 'MYXCROW support joined this conversation.',
      isSystem: true,
      attachmentKey: null,
      attachmentName: null,
      attachmentMime: null,
      createdAt: new Date(),
      user: null,
    });
    const result = await service.joinEscrow('e1', admin);
    expect(result.joined).toBe(true);
  });
});
