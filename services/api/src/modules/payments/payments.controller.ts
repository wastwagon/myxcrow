import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PhoneRequiredGuard } from '../auth/guards/phone-required.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as ICurrentUser } from '../auth/interfaces/current-user.interface';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paystackService: PaystackService,
  ) {}

  @Post('wallet/topup')
  @UseGuards(JwtAuthGuard, PhoneRequiredGuard)
  async initializeWalletTopup(
    @Body() data: { amountCents: number; email: string; holdHours?: number; callbackUrl?: string },
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.paymentsService.initializeWalletTopup({
      userId: user.id,
      email: data.email,
      amountCents: data.amountCents,
      holdHours: data.holdHours,
      callbackUrl: data.callbackUrl,
    });
  }

  @Get('wallet/topup/verify/:reference')
  async verifyWalletTopup(@Param('reference') reference: string) {
    return this.paymentsService.verifyWalletTopup(reference);
  }

  @Post('escrow/:escrowId/initialize')
  @UseGuards(JwtAuthGuard, PhoneRequiredGuard)
  async initializeEscrowPayment(
    @Param('escrowId') escrowId: string,
    @Body() body: { email?: string },
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.paymentsService.initializeEscrowPayment(
      escrowId,
      user.id,
      body.email || user.email,
    );
  }

  @Get('escrow/verify/:reference')
  async verifyEscrowPayment(@Param('reference') reference: string) {
    return this.paymentsService.verifyEscrowFunding(reference);
  }

  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
  ) {
    const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(body);
    const isValid = this.paystackService.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = body.event || (req.body as any)?.event;
    const data = body.data || (req.body as any)?.data;

    return this.paymentsService.handleWebhook(event, data);
  }

  @Get('banks/ghana')
  async getBanks() {
    return this.paystackService.getBanks();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() user: ICurrentUser,
    @Query('escrowId') escrowId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.listPayments(user.id, {
      escrowId,
      type,
      status: status as any,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOne(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    const payment = await this.paymentsService.getPayment(id);
    if (payment && payment.userId !== user.id) {
      throw new UnauthorizedException('Payment not found');
    }
    return payment;
  }
}




