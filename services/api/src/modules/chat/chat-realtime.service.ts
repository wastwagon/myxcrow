import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

@Injectable()
export class ChatRealtimeService {
  private server: Server | null = null;

  attach(server: Server) {
    this.server = server;
  }

  emitToRoom(room: string, event: string, payload: unknown) {
    this.server?.to(room).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitToStaff(event: string, payload: unknown) {
    this.server?.to('staff:support').emit(event, payload);
  }

  escrowRoom(escrowId: string) {
    return `escrow:${escrowId}`;
  }

  supportRoom(conversationId: string) {
    return `support:${conversationId}`;
  }
}
