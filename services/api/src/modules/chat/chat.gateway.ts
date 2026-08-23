import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { ACCESS_COOKIE, parseCookieHeader } from '../auth/auth-cookies';
import { PrismaService } from '../prisma/prisma.service';
import { ChatRealtimeService } from './chat-realtime.service';
import { ChatService } from './chat.service';
import type { CurrentUser } from '../auth/interfaces/current-user.interface';

type JoinPayload = { kind: 'escrow' | 'support'; id: string };
type TypingPayload = JoinPayload & { typing: boolean };

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private chat: ChatService,
    private realtime: ChatRealtimeService,
  ) {}

  afterInit(server: Server) {
    this.realtime.attach(server);
  }

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticate(client);
      if (!user) {
        client.disconnect(true);
        return;
      }
      client.data.user = user;
      await client.join(`user:${user.id}`);
      if (this.chat.isStaff(user)) {
        await client.join('staff:support');
      }
    } catch (error: any) {
      this.logger.debug(`Socket auth failed: ${error?.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect() {
    /* rooms are dropped with the socket */
  }

  @SubscribeMessage('chat:join')
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() body: JoinPayload) {
    const user = this.userOf(client);
    if (!user || !body?.id || !body?.kind) return { ok: false };
    try {
      if (body.kind === 'escrow') {
        await this.chat.assertEscrowAccess(body.id, user);
        await client.join(this.realtime.escrowRoom(body.id));
      } else {
        await this.chat.assertSupportAccess(body.id, user);
        await client.join(this.realtime.supportRoom(body.id));
      }
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message || 'Cannot join' };
    }
  }

  @SubscribeMessage('chat:leave')
  async onLeave(@ConnectedSocket() client: Socket, @MessageBody() body: JoinPayload) {
    if (!body?.id || !body?.kind) return { ok: false };
    const room =
      body.kind === 'escrow' ? this.realtime.escrowRoom(body.id) : this.realtime.supportRoom(body.id);
    await client.leave(room);
    return { ok: true };
  }

  @SubscribeMessage('chat:typing')
  async onTyping(@ConnectedSocket() client: Socket, @MessageBody() body: TypingPayload) {
    const user = this.userOf(client);
    if (!user || !body?.id || !body?.kind) return;
    const room =
      body.kind === 'escrow' ? this.realtime.escrowRoom(body.id) : this.realtime.supportRoom(body.id);
    client.to(room).emit('chat:typing', {
      kind: body.kind,
      threadId: body.id,
      userId: user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      typing: !!body.typing,
    });
  }

  @SubscribeMessage('chat:read')
  async onRead(@ConnectedSocket() client: Socket, @MessageBody() body: JoinPayload) {
    const user = this.userOf(client);
    if (!user || !body?.id || !body?.kind) return;
    try {
      if (body.kind === 'escrow') {
        await this.chat.assertEscrowAccess(body.id, user);
        await this.chat.markEscrowRead(body.id, user.id);
      } else {
        await this.chat.assertSupportAccess(body.id, user);
        await this.chat.markSupportRead(body.id, user.id);
      }
    } catch {
      /* ignore */
    }
  }

  private userOf(client: Socket): CurrentUser | null {
    return (client.data?.user as CurrentUser) || null;
  }

  private async authenticate(client: Socket): Promise<CurrentUser | null> {
    const header = client.handshake.headers.cookie;
    const cookies = parseCookieHeader(typeof header === 'string' ? header : undefined);
    const bearer = client.handshake.headers.authorization;
    const token =
      cookies[ACCESS_COOKIE] ||
      (typeof client.handshake.auth?.token === 'string' ? client.handshake.auth.token : null) ||
      (typeof bearer === 'string' && bearer.startsWith('Bearer ') ? bearer.slice(7) : null);
    if (!token) return null;

    const payload = await this.jwt.verifyAsync<{ sub: string; typ?: string }>(token);
    if (payload?.typ !== 'access' || !payload.sub) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roles: true,
        kycStatus: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive) return null;
    return user;
  }
}
