import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PhoneRequiredGuard } from '../auth/guards/phone-required.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, WithdrawalMethod } from '@prisma/client';

@Controller('wallet')
@UseGuards(JwtAuthGuard, PhoneRequiredGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@CurrentUser() user: any) {
    const wallet = await this.walletService.getWallet(user.id);
    return {
      id: wallet.id,
      userId: wallet.userId,
      currency: wallet.currency,
      availableCents: Number(wallet.availableCents),
      pendingCents: Number(wallet.pendingCents),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  @Get('funding-history')
  async getFundingHistory(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.walletService.getFundingHistory(user.id, limit ? parseInt(limit, 10) : 50);
  }

  @Get('withdrawal-history')
  async getWithdrawalHistory(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.walletService.getWithdrawalHistory(user.id, limit ? parseInt(limit, 10) : 50);
  }

  @Get('transactions')
  async getTransactions(@CurrentUser() user: any, @Query('limit') limit?: string) {
    const raw = await this.walletService.getWalletTransactions(user.id, limit ? parseInt(limit, 10) : 50);
    return raw.map((t: any) => ({
      id: t.id,
      type: t.type,
      amountCents: t.type === 'withdrawal' ? -t.amountCents : t.amountCents,
      currency: t.currency ?? 'GHS',
      createdAt: t.createdAt,
      description: t.type === 'funding' ? (t.externalRef || 'Top-up') : 'Withdrawal',
      reference: t.externalRef ?? t.id,
    }));
  }

  @Post('withdraw')
  async requestWithdrawal(
    @CurrentUser() user: any,
    @Body() data: { amountCents: number; methodType: WithdrawalMethod; methodDetails: any; feeCents?: number },
  ) {
    return this.walletService.requestWithdrawal({
      userId: user.id,
      amountCents: data.amountCents,
      methodType: data.methodType,
      methodDetails: data.methodDetails,
      feeCents: data.feeCents,
    });
  }

  @Get('admin/withdrawals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async listWithdrawals(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.listWithdrawals({
      status: status as any,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Put('withdraw/:id/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async processWithdrawal(
    @Param('id') id: string,
    @Body() data: { succeeded: boolean; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.walletService.processWithdrawal(id, user.id, data.succeeded, data.reason);
  }

  @Put('funding/:id/transfer-pending-to-available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async transferPendingToAvailable(@Param('id') id: string, @CurrentUser() user: any) {
    return this.walletService.transferPendingToAvailable(id, user.id);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post('admin/credit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async creditWallet(
    @Body()
    data: {
      userId: string;
      amountCents: number;
      currency?: string;
      description?: string;
      reference?: string;
    },
    @CurrentUser() admin: any,
  ) {
    return this.walletService.creditWallet({
      userId: data.userId,
      amountCents: data.amountCents,
      currency: data.currency,
      description: data.description,
      reference: data.reference,
      adminId: admin.id,
    });
  }

  @Post('admin/debit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async debitWallet(
    @Body()
    data: {
      userId: string;
      amountCents: number;
      currency?: string;
      description: string;
      reference?: string;
    },
    @CurrentUser() admin: any,
  ) {
    return this.walletService.debitWallet({
      userId: data.userId,
      amountCents: data.amountCents,
      currency: data.currency,
      description: data.description,
      reference: data.reference,
      adminId: admin.id,
    });
  }

  @Get('admin/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getWalletByUserId(@Param('userId') userId: string) {
    const result = await this.walletService.getWalletByUserId(userId);
    return {
      wallet: {
        id: result.wallet.id,
        userId: result.wallet.userId,
        currency: result.wallet.currency,
        availableCents: Number(result.wallet.availableCents),
        pendingCents: Number(result.wallet.pendingCents),
        createdAt: result.wallet.createdAt,
        updatedAt: result.wallet.updatedAt,
      },
      user: result.user,
    };
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async listWallets(
    @Query('userId') userId?: string,
    @Query('email') email?: string,
    @Query('minBalance') minBalance?: string,
    @Query('maxBalance') maxBalance?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.listWallets({
      userId,
      email,
      minBalance: minBalance ? parseInt(minBalance, 10) : undefined,
      maxBalance: maxBalance ? parseInt(maxBalance, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('admin/:userId/transactions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getWalletTransactions(@Param('userId') userId: string, @Query('limit') limit?: string) {
    return this.walletService.getWalletTransactions(userId, limit ? parseInt(limit, 10) : 50);
  }
}
