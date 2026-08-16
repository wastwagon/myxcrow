import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.publicKey = this.configService.get<string>('PAYSTACK_PUBLIC_KEY') || '';
  }

  async initializePayment(data: {
    email: string;
    amount: number;
    currency?: string;
    reference?: string;
    metadata?: any;
    callback_url?: string;
    channels?: string[];
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email: data.email,
          amount: data.amount,
          currency: data.currency || 'GHS',
          reference: data.reference,
          metadata: data.metadata,
          callback_url: data.callback_url,
          channels: data.channels || ['card', 'bank', 'mobile_money', 'ussd'],
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`Paystack initialize payment error: ${error.message}`);
      throw error;
    }
  }

  async verifyPayment(reference: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`Paystack verify payment error: ${error.message}`);
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Paystack HMAC-SHA512s the body with the secret key. Optional PAYSTACK_WEBHOOK_SECRET overrides.
    const secret = (
      this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET') ||
      this.configService.get<string>('PAYSTACK_SECRET_KEY') ||
      ''
    ).trim();
    if (!secret || !signature) {
      return false;
    }
    const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
    const a = Buffer.from(hash, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  }

  async getBanks() {
    try {
      const response = await axios.get(`${this.baseUrl}/bank?country=ghana`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`Paystack get banks error: ${error.message}`);
      throw error;
    }
  }
}




