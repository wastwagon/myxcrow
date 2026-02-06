import {
  Controller,
  Get,
  Post,
  Param,
  Body,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paystackService: PaystackService,
  ) {}

  @Post('wallet/topup')
  @UseGuards(JwtAuthGuard)
  async initializeWalletTopup(
    @Body() data: { amountCents: number; email: string; holdHours?: number },
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.initializeWalletTopup({
      userId: user.id,
      email: data.email,
      amountCents: data.amountCents,
      holdHours: data.holdHours,
    });
  }

  @Get('wallet/topup/verify/:reference')
  async verifyWalletTopup(@Param('reference') reference: string) {
    return this.paymentsService.verifyWalletTopup(reference);
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

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }

  @Get()
  async list(@Body() filters: { userId?: string; escrowId?: string; type?: string; status?: string }) {
    if (!filters.userId) {
      throw new Error('userId is required');
    }
    return this.paymentsService.listPayments(filters.userId, {
      escrowId: filters.escrowId,
      type: filters.type,
      status: filters.status as any,
    });
  }
}




