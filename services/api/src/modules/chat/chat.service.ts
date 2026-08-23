import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupportConversationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AntivirusService } from '../../common/security/antivirus.service';
import { isEscrowStaff } from '../escrow/guards/escrow-access.guard';
import { ChatRealtimeService } from './chat-realtime.service';
import { ChatStorageService } from './chat-storage.service';
import type { ChatMessageDto, ChatPerson, ChatThreadDto, ChatUnreadDto } from './chat.types';
import type { CurrentUser } from '../auth/interfaces/current-user.interface';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  roles: true,
} as const;

const ALLOWED_CHAT_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

const MAX_CHAT_FILE_BYTES = 8 * 1024 * 1024;
const PREVIEW_LEN = 120;

type UploadedChatFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly sendTimes = new Map<string, number[]>();

  constructor(
    private prisma: PrismaService,
    private realtime: ChatRealtimeService,
    private storage: ChatStorageService,
    private antivirus: AntivirusService,
  ) {}

  isStaff(user?: { roles?: string[] }) {
    return isEscrowStaff(user);
  }

  private person(user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null): ChatPerson | null {
    if (!user) return null;
    return {
      id: user.id,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      email: user.email,
    };
  }

  private preview(content: string, hasFile: boolean) {
    const text = content.trim();
    if (text) return text.slice(0, PREVIEW_LEN);
    return hasFile ? 'Photo' : '';
  }

  private throttle(userId: string) {
    const now = Date.now();
    const windowMs = 60_000;
    const recent = (this.sendTimes.get(userId) || []).filter((t) => now - t < windowMs);
    if (recent.length >= 30) {
      throw new BadRequestException('You are sending messages too quickly. Please wait a moment.');
    }
    recent.push(now);
    this.sendTimes.set(userId, recent);
  }

  private async uploadAttachment(prefix: string, file: UploadedChatFile) {
    if (file.size > MAX_CHAT_FILE_BYTES) {
      throw new BadRequestException('File is too large. Maximum size is 8 MB.');
    }
    if (!ALLOWED_CHAT_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only photos (JPEG, PNG, WebP, GIF) and PDFs are allowed.');
    }
    const scan = await this.antivirus.scanFile(file.buffer, file.originalname, file.mimetype);
    if (!scan.safe) {
      throw new BadRequestException(scan.reason || 'This file could not be accepted.');
    }
    if (!this.storage.isReady()) {
      throw new BadRequestException('Photo upload is not available right now.');
    }
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const key = `${prefix}/${Date.now()}_${safeName}`;
    await this.storage.putObject(key, file.buffer, file.mimetype);
    return { key, name: file.originalname.slice(0, 120), mime: file.mimetype };
  }

  private async attachmentDto(key?: string | null, name?: string | null, mime?: string | null) {
    if (!key) return null;
    return {
      url: `/api/chat/files?key=${encodeURIComponent(key)}`,
      name: name || 'attachment',
      mime: mime || 'application/octet-stream',
    };
  }

  async openAttachment(key: string, user: CurrentUser) {
    if (!key || key.includes('..') || key.includes('\\')) {
      throw new BadRequestException('Invalid file');
    }
    const parts = key.split('/');
    if (parts[0] !== 'chat' || parts.length < 4) {
      throw new ForbiddenException('You cannot open this file');
    }
    const kind = parts[1];
    const threadId = parts[2];
    if (kind === 'escrow') {
      await this.assertEscrowAccess(threadId, user);
      const row = await this.prisma.escrowMessage.findFirst({ where: { attachmentKey: key } });
      if (!row) throw new NotFoundException('File not found');
      return { mime: row.attachmentMime || 'application/octet-stream', name: row.attachmentName || 'attachment' };
    }
    if (kind === 'support') {
      await this.assertSupportAccess(threadId, user);
      const row = await this.prisma.supportMessage.findFirst({ where: { attachmentKey: key } });
      if (!row) throw new NotFoundException('File not found');
      return { mime: row.attachmentMime || 'application/octet-stream', name: row.attachmentName || 'attachment' };
    }
    throw new ForbiddenException('You cannot open this file');
  }

  async streamAttachment(key: string, user: CurrentUser) {
    const meta = await this.openAttachment(key, user);
    const stream = await this.storage.getObject(key);
    return { ...meta, stream };
  }

  private async toEscrowDto(row: {
    id: string;
    escrowId: string;
    userId: string | null;
    content: string;
    isSystem: boolean;
    attachmentKey: string | null;
    attachmentName: string | null;
    attachmentMime: string | null;
    createdAt: Date;
    user?: { id: string; firstName: string | null; lastName: string | null; email: string; roles?: UserRole[] } | null;
  }): Promise<ChatMessageDto> {
    return {
      id: row.id,
      kind: 'escrow',
      threadId: row.escrowId,
      senderId: row.userId,
      sender: this.person(row.user),
      content: row.content,
      isSystem: row.isSystem,
      isStaff: !!row.user?.roles?.some((r) => r === UserRole.ADMIN || r === UserRole.SUPPORT),
      attachment: await this.attachmentDto(row.attachmentKey, row.attachmentName, row.attachmentMime),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async toSupportDto(row: {
    id: string;
    conversationId: string;
    senderId: string | null;
    content: string;
    isSystem: boolean;
    attachmentKey: string | null;
    attachmentName: string | null;
    attachmentMime: string | null;
    createdAt: Date;
    sender?: { id: string; firstName: string | null; lastName: string | null; email: string; roles?: UserRole[] } | null;
  }): Promise<ChatMessageDto> {
    return {
      id: row.id,
      kind: 'support',
      threadId: row.conversationId,
      senderId: row.senderId,
      sender: this.person(row.sender),
      content: row.content,
      isSystem: row.isSystem,
      isStaff: !!row.sender?.roles?.some((r) => r === UserRole.ADMIN || r === UserRole.SUPPORT),
      attachment: await this.attachmentDto(row.attachmentKey, row.attachmentName, row.attachmentMime),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async assertEscrowAccess(escrowId: string, user: CurrentUser) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        supportJoinedAt: true,
        description: true,
        status: true,
        buyer: { select: USER_SELECT },
        seller: { select: USER_SELECT },
      },
    });
    if (!escrow) throw new NotFoundException('Escrow not found');
    const participant = escrow.buyerId === user.id || escrow.sellerId === user.id;
    if (!participant && !this.isStaff(user)) {
      throw new ForbiddenException('You are not a participant in this escrow');
    }
    return escrow;
  }

  async assertSupportAccess(conversationId: string, user: CurrentUser) {
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: {
        user: { select: USER_SELECT },
        assignee: { select: USER_SELECT },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.userId !== user.id && !this.isStaff(user)) {
      throw new ForbiddenException('You cannot access this conversation');
    }
    return conversation;
  }

  async listEscrowMessages(escrowId: string, user: CurrentUser): Promise<ChatMessageDto[]> {
    await this.assertEscrowAccess(escrowId, user);
    const rows = await this.prisma.escrowMessage.findMany({
      where: { escrowId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    return Promise.all(rows.map((row) => this.toEscrowDto(row)));
  }

  async sendEscrowMessage(
    escrowId: string,
    user: CurrentUser,
    content: string,
    file?: UploadedChatFile,
  ): Promise<ChatMessageDto> {
    this.throttle(user.id);
    const escrow = await this.assertEscrowAccess(escrowId, user);
    const staff = this.isStaff(user);
    const participant = escrow.buyerId === user.id || escrow.sellerId === user.id;
    if (!participant && !staff) {
      throw new ForbiddenException('You are not a participant in this escrow');
    }
    if (staff && !participant && !escrow.supportJoinedAt) {
      await this.joinEscrow(escrowId, user);
    }

    const text = (content || '').trim();
    if (!text && !file) throw new BadRequestException('Message cannot be empty');

    let attachment: { key: string; name: string; mime: string } | undefined;
    if (file) {
      attachment = await this.uploadAttachment(`chat/escrow/${escrowId}`, file);
    }

    const row = await this.prisma.escrowMessage.create({
      data: {
        escrowId,
        userId: user.id,
        content: text,
        isSystem: false,
        attachmentKey: attachment?.key,
        attachmentName: attachment?.name,
        attachmentMime: attachment?.mime,
      },
      include: { user: { select: USER_SELECT } },
    });
    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: { updatedAt: new Date() },
    });
    await this.markEscrowRead(escrowId, user.id);

    const dto = await this.toEscrowDto(row);
    this.realtime.emitToRoom(this.realtime.escrowRoom(escrowId), 'chat:message', dto);
    const recipientIds = [escrow.buyerId, escrow.sellerId].filter((id) => id !== user.id);
    for (const id of recipientIds) {
      this.realtime.emitToUser(id, 'chat:unread', { kind: 'escrow', threadId: escrowId });
    }
    if (staff) {
      this.realtime.emitToStaff('chat:unread', { kind: 'escrow', threadId: escrowId });
    }
    return dto;
  }

  async joinEscrow(escrowId: string, user: CurrentUser) {
    if (!this.isStaff(user)) {
      throw new ForbiddenException('Only support staff can join an escrow chat');
    }
    const escrow = await this.assertEscrowAccess(escrowId, user);
    if (escrow.supportJoinedAt) {
      return { joined: true, alreadyJoined: true };
    }
    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: { supportJoinedAt: new Date() },
    });
    await this.postEscrowSystemMessage(escrowId, 'MYXCROW support joined this conversation.');
    return { joined: true, alreadyJoined: false };
  }

  async postEscrowSystemMessage(escrowId: string, content: string): Promise<ChatMessageDto | null> {
    try {
      const row = await this.prisma.escrowMessage.create({
        data: {
          escrowId,
          userId: null,
          content,
          isSystem: true,
        },
        include: { user: { select: USER_SELECT } },
      });
      const dto = await this.toEscrowDto(row);
      this.realtime.emitToRoom(this.realtime.escrowRoom(escrowId), 'chat:message', dto);
      return dto;
    } catch (error: any) {
      this.logger.warn(`System escrow message failed: ${error?.message}`);
      return null;
    }
  }

  async announceEscrowEvent(escrowId: string, event: string) {
    const copy: Record<string, string> = {
      FUNDED: 'Escrow funded. The seller can now start delivery or work.',
      SHIPPED: 'Seller marked this as shipped.',
      DELIVERED: 'Delivery confirmed.',
      RELEASED: 'Funds released to the seller.',
      REFUNDED: 'Funds refunded to the buyer.',
      CANCELLED: 'This escrow was cancelled.',
      DISPUTED: 'A dispute was opened. Continue in the dispute thread if you need mediation.',
    };
    const text = copy[event];
    if (!text) return;
    await this.postEscrowSystemMessage(escrowId, text);
  }

  async markEscrowRead(escrowId: string, userId: string) {
    await this.prisma.escrowThreadRead.upsert({
      where: { escrowId_userId: { escrowId, userId } },
      create: { escrowId, userId, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });
    this.realtime.emitToRoom(this.realtime.escrowRoom(escrowId), 'chat:read', {
      kind: 'escrow',
      threadId: escrowId,
      userId,
    });
  }

  async getOrCreateSupport(user: CurrentUser) {
    if (this.isStaff(user)) {
      throw new BadRequestException('Staff should open the support inbox instead.');
    }
    let conversation = await this.prisma.supportConversation.findFirst({
      where: { userId: user.id, status: SupportConversationStatus.OPEN },
      orderBy: { lastMessageAt: 'desc' },
      include: { user: { select: USER_SELECT }, assignee: { select: USER_SELECT } },
    });
    if (!conversation) {
      conversation = await this.prisma.supportConversation.create({
        data: {
          userId: user.id,
          lastMessagePreview: 'New conversation',
        },
        include: { user: { select: USER_SELECT }, assignee: { select: USER_SELECT } },
      });
      await this.prisma.supportMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: null,
          isSystem: true,
          content: 'You are chatting with MYXCROW support. Tell us your escrow ID if this is about a transaction.',
        },
      });
    }
    return conversation;
  }

  async listSupportMessages(conversationId: string, user: CurrentUser): Promise<ChatMessageDto[]> {
    await this.assertSupportAccess(conversationId, user);
    const rows = await this.prisma.supportMessage.findMany({
      where: { conversationId },
      include: { sender: { select: USER_SELECT } },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    return Promise.all(rows.map((row) => this.toSupportDto(row)));
  }

  async sendSupportMessage(
    conversationId: string,
    user: CurrentUser,
    content: string,
    file?: UploadedChatFile,
  ): Promise<ChatMessageDto> {
    this.throttle(user.id);
    const conversation = await this.assertSupportAccess(conversationId, user);
    const staff = this.isStaff(user);
    const text = (content || '').trim();
    if (!text && !file) throw new BadRequestException('Message cannot be empty');

    if (conversation.status === SupportConversationStatus.CLOSED) {
      await this.prisma.supportConversation.update({
        where: { id: conversationId },
        data: { status: SupportConversationStatus.OPEN },
      });
    }

    if (staff && !conversation.assignedToId) {
      await this.prisma.supportConversation.update({
        where: { id: conversationId },
        data: { assignedToId: user.id },
      });
    }

    let attachment: { key: string; name: string; mime: string } | undefined;
    if (file) {
      attachment = await this.uploadAttachment(`chat/support/${conversationId}`, file);
    }

    const row = await this.prisma.supportMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        content: text,
        attachmentKey: attachment?.key,
        attachmentName: attachment?.name,
        attachmentMime: attachment?.mime,
      },
      include: { sender: { select: USER_SELECT } },
    });

    const preview = this.preview(text, !!attachment);
    await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), lastMessagePreview: preview },
    });
    await this.markSupportRead(conversationId, user.id);

    const dto = await this.toSupportDto(row);
    this.realtime.emitToRoom(this.realtime.supportRoom(conversationId), 'chat:message', dto);
    if (staff) {
      this.realtime.emitToUser(conversation.userId, 'chat:unread', {
        kind: 'support',
        threadId: conversationId,
      });
    } else {
      this.realtime.emitToStaff('chat:unread', { kind: 'support', threadId: conversationId });
    }
    return dto;
  }

  async markSupportRead(conversationId: string, userId: string) {
    await this.prisma.supportThreadRead.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });
    this.realtime.emitToRoom(this.realtime.supportRoom(conversationId), 'chat:read', {
      kind: 'support',
      threadId: conversationId,
      userId,
    });
  }

  async closeSupport(conversationId: string, user: CurrentUser) {
    if (!this.isStaff(user)) {
      throw new ForbiddenException('Only support staff can close a conversation');
    }
    await this.assertSupportAccess(conversationId, user);
    await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { status: SupportConversationStatus.CLOSED },
    });
    const row = await this.prisma.supportMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        isSystem: true,
        content: 'This conversation was marked resolved.',
      },
      include: { sender: { select: USER_SELECT } },
    });
    const dto = await this.toSupportDto(row);
    this.realtime.emitToRoom(this.realtime.supportRoom(conversationId), 'chat:message', dto);
    return { closed: true };
  }

  async listSupportInbox(user: CurrentUser, status: 'OPEN' | 'CLOSED' | 'ALL' = 'OPEN') {
    if (!this.isStaff(user)) {
      throw new ForbiddenException('Only support staff can view the inbox');
    }
    const where =
      status === 'ALL' ? {} : { status: status as SupportConversationStatus };
    const rows = await this.prisma.supportConversation.findMany({
      where,
      include: {
        user: { select: USER_SELECT },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: USER_SELECT } } },
        reads: { where: { userId: user.id } },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
    return Promise.all(
      rows.map(async (row) => {
        const last = row.messages[0];
        const lastRead = row.reads[0]?.lastReadAt ?? new Date(0);
        const unread =
          last && last.createdAt > lastRead && last.senderId !== user.id ? 1 : 0;
        const thread: ChatThreadDto = {
          kind: 'support',
          id: row.id,
          title: this.displayName(row.user),
          subtitle: row.user.email,
          lastMessage: row.lastMessagePreview || last?.content || '',
          lastMessageAt: (last?.createdAt || row.lastMessageAt).toISOString(),
          unreadCount: unread,
          status: row.status,
          counterpart: this.person(row.user),
          href: `/admin/support/${row.id}`,
        };
        return thread;
      }),
    );
  }

  async customerInbox(user: CurrentUser): Promise<ChatThreadDto[]> {
    const [escrows, support] = await Promise.all([
      this.prisma.escrowAgreement.findMany({
        where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
        select: {
          id: true,
          description: true,
          status: true,
          updatedAt: true,
          buyerId: true,
          sellerId: true,
          buyer: { select: USER_SELECT },
          seller: { select: USER_SELECT },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          threadReads: { where: { userId: user.id } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      this.prisma.supportConversation.findMany({
        where: { userId: user.id },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          reads: { where: { userId: user.id } },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: 5,
      }),
    ]);

    const escrowThreads: ChatThreadDto[] = await Promise.all(
      escrows
        .filter((e) => e.messages.length > 0)
        .map(async (e) => {
          const last = e.messages[0];
          const lastRead = e.threadReads[0]?.lastReadAt ?? new Date(0);
          const unreadCount = await this.prisma.escrowMessage.count({
            where: {
              escrowId: e.id,
              createdAt: { gt: lastRead },
              OR: [{ userId: null }, { userId: { not: user.id } }],
            },
          });
          const other = e.buyerId === user.id ? e.seller : e.buyer;
          return {
            kind: 'escrow' as const,
            id: e.id,
            title: this.displayName(other),
            subtitle: e.description || 'Escrow',
            lastMessage: last.isSystem ? last.content : last.content || (last.attachmentKey ? 'Photo' : ''),
            lastMessageAt: last.createdAt.toISOString(),
            unreadCount,
            status: e.status,
            counterpart: this.person(other),
            href: `/escrows/${e.id}?tab=messages`,
          };
        }),
    );

    const supportThreads: ChatThreadDto[] = support.map((row) => {
      const last = row.messages[0];
      const lastRead = row.reads[0]?.lastReadAt ?? new Date(0);
      const unread =
        last && last.createdAt > lastRead && last.senderId !== user.id ? 1 : 0;
      return {
        kind: 'support' as const,
        id: row.id,
        title: 'MYXCROW support',
        subtitle: row.status === 'OPEN' ? 'Live help' : 'Resolved',
        lastMessage: row.lastMessagePreview || last?.content || '',
        lastMessageAt: (last?.createdAt || row.lastMessageAt).toISOString(),
        unreadCount: unread,
        status: row.status,
        href: '/messages/support',
      };
    });

    return [...supportThreads, ...escrowThreads].sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });
  }

  async unreadCounts(user: CurrentUser): Promise<ChatUnreadDto> {
    if (this.isStaff(user)) {
      const open = await this.prisma.supportConversation.findMany({
        where: { status: SupportConversationStatus.OPEN },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          reads: { where: { userId: user.id } },
        },
      });
      const support = open.filter((row) => {
        const last = row.messages[0];
        const lastRead = row.reads[0]?.lastReadAt ?? new Date(0);
        return last && last.createdAt > lastRead && last.senderId !== user.id;
      }).length;
      return { escrow: 0, support, total: support };
    }

    const escrows = await this.prisma.escrowAgreement.findMany({
      where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
      select: { id: true, threadReads: { where: { userId: user.id } } },
    });
    let escrowUnread = 0;
    for (const e of escrows) {
      const lastRead = e.threadReads[0]?.lastReadAt ?? new Date(0);
      escrowUnread += await this.prisma.escrowMessage.count({
        where: {
          escrowId: e.id,
          createdAt: { gt: lastRead },
          OR: [{ userId: null }, { userId: { not: user.id } }],
        },
      });
    }
    const supportRows = await this.prisma.supportConversation.findMany({
      where: { userId: user.id, status: SupportConversationStatus.OPEN },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        reads: { where: { userId: user.id } },
      },
    });
    const support = supportRows.filter((row) => {
      const last = row.messages[0];
      const lastRead = row.reads[0]?.lastReadAt ?? new Date(0);
      return last && last.createdAt > lastRead && last.senderId !== user.id && !last.isSystem;
    }).length;
    return { escrow: escrowUnread, support, total: escrowUnread + support };
  }

  private displayName(user?: { firstName?: string | null; lastName?: string | null; email?: string } | null) {
    if (!user) return 'User';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || user.email || 'User';
  }
}
