import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as ICurrentUser } from '../auth/interfaces/current-user.interface';
import { ChatService } from './chat.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('unread')
  unread(@CurrentUser() user: ICurrentUser) {
    return this.chat.unreadCounts(user);
  }

  @Get('inbox')
  inbox(@CurrentUser() user: ICurrentUser) {
    return this.chat.customerInbox(user);
  }

  @Get('files')
  async file(@Query('key') key: string, @CurrentUser() user: ICurrentUser) {
    const { stream, mime, name } = await this.chat.streamAttachment(key || '', user);
    return new StreamableFile(stream, {
      type: mime,
      disposition: `inline; filename="${name.replace(/"/g, '')}"`,
    });
  }

  @Get('escrows/:id/messages')
  escrowMessages(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.chat.listEscrowMessages(id, user);
  }

  @Post('escrows/:id/messages')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  sendEscrow(
    @Param('id') id: string,
    @CurrentUser() user: ICurrentUser,
    @Body() body: SendChatMessageDto,
    @UploadedFile() file?: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ) {
    return this.chat.sendEscrowMessage(id, user, body.content || '', file);
  }

  @Post('escrows/:id/read')
  async readEscrow(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    await this.chat.assertEscrowAccess(id, user);
    await this.chat.markEscrowRead(id, user.id);
    return { ok: true };
  }

  @Post('escrows/:id/join')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  joinEscrow(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.chat.joinEscrow(id, user);
  }

  @Get('support')
  async mySupport(@CurrentUser() user: ICurrentUser) {
    const conversation = await this.chat.getOrCreateSupport(user);
    const messages = await this.chat.listSupportMessages(conversation.id, user);
    return { conversation, messages };
  }

  @Get('support/:id/messages')
  supportMessages(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.chat.listSupportMessages(id, user);
  }

  @Post('support/:id/messages')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  sendSupport(
    @Param('id') id: string,
    @CurrentUser() user: ICurrentUser,
    @Body() body: SendChatMessageDto,
    @UploadedFile() file?: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ) {
    return this.chat.sendSupportMessage(id, user, body.content || '', file);
  }

  @Post('support/:id/read')
  async readSupport(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    await this.chat.assertSupportAccess(id, user);
    await this.chat.markSupportRead(id, user.id);
    return { ok: true };
  }

  @Post('support/:id/close')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  closeSupport(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.chat.closeSupport(id, user);
  }

  @Get('admin/support')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  adminInbox(
    @CurrentUser() user: ICurrentUser,
    @Query('status') status?: 'OPEN' | 'CLOSED' | 'ALL',
  ) {
    return this.chat.listSupportInbox(user, status || 'OPEN');
  }
}
