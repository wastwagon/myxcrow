import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { QueueService } from '../../common/queue/queue.service';

export enum SMSProvider {
  AFRICAS_TALKING = 'africas_talking',
  TWILIO = 'twilio',
  ARKESEL = 'arkesel',
  NONE = 'none',
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name);
  private readonly provider: SMSProvider;
  private readonly enabled: boolean;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => QueueService))
    private queueService?: QueueService,
  ) {
    this.provider = (this.configService.get<string>('SMS_PROVIDER') || 'none') as SMSProvider;
    this.enabled = this.configService.get<string>('SMS_ENABLED') === 'true' && this.provider !== SMSProvider.NONE;

    if (this.enabled) {
      this.logger.log(`SMS Service initialized with provider: ${this.provider}`);
    } else {
      this.logger.warn('SMS Service is disabled');
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(
    to: string | string[],
    message: string,
    useQueue: boolean = true,
  ): Promise<SMSResponse | SMSResponse[]> {
    if (!this.enabled) {
      this.logger.debug('SMS is disabled, skipping send');
      return Array.isArray(to)
        ? to.map(() => ({ success: false, error: 'SMS disabled' }))
        : { success: false, error: 'SMS disabled' };
    }

    // Normalize phone numbers
    const recipients = Array.isArray(to) ? to : [to];
    const normalizedRecipients = recipients.map((phone) => this.normalizePhoneNumber(phone));

    // Use queue if available, otherwise send directly
    if (useQueue && this.queueService) {
      try {
        const results = await Promise.all(
          normalizedRecipients.map((phone) =>
            this.queueService!.addSMSJob({
              to: phone,
              message,
            }),
          ),
        );
        this.logger.log(`SMS queued for ${normalizedRecipients.join(', ')}`);
        return Array.isArray(to)
          ? results.map(() => ({ success: true }))
          : { success: true };
      } catch (error: any) {
        this.logger.warn(`Failed to queue SMS, sending directly: ${error.message}`);
      }
    }

    // Fallback to direct send
    try {
      const results = await Promise.all(
        normalizedRecipients.map((phone) => this.sendDirect(phone, message)),
      );
      this.logger.log(`SMS sent directly to ${normalizedRecipients.join(', ')}`);
      return Array.isArray(to) ? results : results[0];
    } catch (error: any) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send SMS directly (without queue)
   */
  private async sendDirect(to: string, message: string): Promise<SMSResponse> {
    switch (this.provider) {
      case SMSProvider.AFRICAS_TALKING:
        return this.sendViaAfricasTalking(to, message);
      case SMSProvider.TWILIO:
        return this.sendViaTwilio(to, message);
      case SMSProvider.ARKESEL:
        return this.sendViaArkesel(to, message);
      default:
        this.logger.warn(`Unknown SMS provider: ${this.provider}`);
        return { success: false, error: 'Unknown provider' };
    }
  }

  /**
   * Send SMS via Arkesel (Ghana) - SMS API v2
   * Phone format: 233XXXXXXXXX (international, no +)
   * Falls back to sender "Arkesel" if configured sender (e.g. MYXCROW) fails with invalid sender error (status 106)
   */
  private async sendViaArkesel(to: string, message: string): Promise<SMSResponse> {
    const apiKey = this.configService.get<string>('ARKESEL_API_KEY') || this.configService.get<string>('SMS_API_KEY');
    const primarySender = this.configService.get<string>('SMS_SENDER_ID') || 'MYXCROW';

    if (!apiKey) {
      return { success: false, error: 'Arkesel API key not configured (ARKESEL_API_KEY or SMS_API_KEY)' };
    }

    const result = await this.arkeselSend(to, message, apiKey, primarySender);
    if (result.success) return result;

    // Fallback: retry with "Arkesel" if primary sender failed (e.g. MYXCROW not registered, status 106)
    const errLower = (result.error || '').toLowerCase();
    const isSenderError =
      errLower.includes('sender') ||
      errLower.includes('106') ||
      (primarySender !== 'Arkesel' && errLower.includes('invalid'));

    if (isSenderError && primarySender !== 'Arkesel') {
      this.logger.warn(`Arkesel sender "${primarySender}" failed, retrying with "Arkesel"`);
      return this.arkeselSend(to, message, apiKey, 'Arkesel');
    }

    return result;
  }

  private async arkeselSend(
    to: string,
    message: string,
    apiKey: string,
    sender: string,
  ): Promise<SMSResponse> {
    try {
      const recipient = to.replace(/^\+/, '');
      const response = await axios.post(
        'https://sms.arkesel.com/api/v2/sms/send',
        { sender, message, recipients: [recipient] },
        {
          headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
        },
      );

      if (response.data?.status === 'success' && response.data?.data?.[0]?.id) {
        return { success: true, messageId: response.data.data[0].id };
      }

      const errMsg = response.data?.message || response.data?.status || 'Unknown error';
      return { success: false, error: String(errMsg) };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.response?.data?.status || error.message;
      this.logger.error(`Arkesel SMS error: ${errMsg}`);
      return { success: false, error: String(errMsg) };
    }
  }

  /**
   * Send SMS via Africa's Talking
   */
  private async sendViaAfricasTalking(to: string, message: string): Promise<SMSResponse> {
    try {
      const username = this.configService.get<string>('AFRICASTALKING_USERNAME');
      const apiKey = this.configService.get<string>('AFRICASTALKING_API_KEY');
      const senderId = this.configService.get<string>('SMS_SENDER_ID') || 'MYXCROW';

      if (!username || !apiKey) {
        throw new Error('Africa\'s Talking credentials not configured');
      }

      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        new URLSearchParams({
          username,
          to,
          message,
          from: senderId,
        }),
        {
          headers: {
            apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        },
      );

      if (response.data.SMSMessageData?.Recipients?.[0]?.statusCode === 101) {
        return {
          success: true,
          messageId: response.data.SMSMessageData.Recipients[0].messageId,
        };
      }

      return {
        success: false,
        error: response.data.SMSMessageData?.Recipients?.[0]?.status || 'Unknown error',
      };
    } catch (error: any) {
      this.logger.error(`Africa's Talking SMS error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(to: string, message: string): Promise<SMSResponse> {
    try {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio credentials not configured');
      }

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
        {
          auth: {
            username: accountSid,
            password: authToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.status === 'queued' || response.data.status === 'sent') {
        return {
          success: true,
          messageId: response.data.sid,
        };
      }

      return {
        success: false,
        error: response.data.error_message || 'Unknown error',
      };
    } catch (error: any) {
      this.logger.error(`Twilio SMS error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Normalize phone number to international format
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');

    // If starts with 0, replace with country code (Ghana: +233)
    if (normalized.startsWith('0')) {
      normalized = '233' + normalized.substring(1);
    }

    // If doesn't start with country code, add it (Ghana: +233)
    if (!normalized.startsWith('233')) {
      normalized = '233' + normalized;
    }

    // Add + prefix
    return '+' + normalized;
  }

  /**
   * Send phone verification OTP via SMS (Ghana format only)
   */
  async sendVerificationOtpSms(to: string, code: string): Promise<SMSResponse> {
    const message = `Your MYXCROW verification code is: ${code}. Valid for 5 minutes. Do not share with anyone.`;
    const result = await this.sendSMS(to, message, false);
    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * Send escrow created SMS
   */
  async sendEscrowCreatedSMS(data: {
    to: string[];
    escrowId: string;
    amount: string;
    currency: string;
  }) {
    const message = `MYXCROW: Escrow ${data.escrowId} created. Amount: ${data.amount} ${data.currency}. Check your dashboard for details.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send escrow funded SMS
   */
  async sendEscrowFundedSMS(data: {
    to: string[];
    escrowId: string;
    amount: string;
    currency: string;
  }) {
    const message = `MYXCROW: Escrow ${data.escrowId} funded with ${data.amount} ${data.currency}. Funds are secured.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send escrow shipped SMS
   */
  async sendEscrowShippedSMS(data: { to: string[]; escrowId: string }) {
    const message = `MYXCROW: Escrow ${data.escrowId} has been marked as shipped. Track delivery on your dashboard.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send escrow delivered SMS
   */
  async sendEscrowDeliveredSMS(data: { to: string[]; escrowId: string }) {
    const message = `MYXCROW: Escrow ${data.escrowId} has been delivered. Please confirm receipt to release funds.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send escrow released SMS
   */
  async sendEscrowReleasedSMS(data: {
    to: string[];
    escrowId: string;
    amount: string;
    currency: string;
  }) {
    const message = `MYXCROW: Funds for escrow ${data.escrowId} have been released. Amount: ${data.amount} ${data.currency}.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send dispute opened SMS
   */
  async sendDisputeOpenedSMS(data: {
    to: string[];
    escrowId: string;
    disputeId: string;
  }) {
    const message = `MYXCROW: A dispute has been opened for escrow ${data.escrowId}. Dispute ID: ${data.disputeId}. We'll review and resolve it.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send dispute resolved SMS
   */
  async sendDisputeResolvedSMS(data: {
    to: string[];
    escrowId: string;
    disputeId: string;
  }) {
    const message = `MYXCROW: Dispute ${data.disputeId} for escrow ${data.escrowId} has been resolved. Check your dashboard for details.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send wallet top-up SMS
   */
  async sendWalletTopUpSMS(data: {
    to: string;
    amount: string;
    currency: string;
    status: string;
  }) {
    const statusText = data.status === 'SUCCEEDED' ? 'successful' : 'pending';
    const message = `MYXCROW: Wallet top-up ${statusText}. Amount: ${data.amount} ${data.currency}.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send withdrawal approved SMS
   */
  async sendWithdrawalApprovedSMS(data: {
    to: string;
    amount: string;
    currency: string;
  }) {
    const message = `MYXCROW: Your withdrawal of ${data.amount} ${data.currency} has been approved. Funds will be processed shortly.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send withdrawal denied SMS
   */
  async sendWithdrawalDeniedSMS(data: {
    to: string;
    amount: string;
    currency: string;
    reason: string;
  }) {
    const message = `MYXCROW: Your withdrawal of ${data.amount} ${data.currency} was denied. Reason: ${data.reason}. Contact support for assistance.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send KYC status update SMS
   */
  async sendKYCStatusUpdateSMS(data: {
    to: string;
    status: string;
  }) {
    const statusText = data.status === 'APPROVED' ? 'approved' : data.status === 'REJECTED' ? 'rejected' : 'pending';
    const message = `MYXCROW: Your KYC verification has been ${statusText}. Check your dashboard for details.`;
    return this.sendSMS(data.to, message);
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmationSMS(data: {
    to: string;
    amount: string;
    currency: string;
    reference: string;
  }) {
    const message = `MYXCROW: Payment confirmed. Amount: ${data.amount} ${data.currency}. Reference: ${data.reference}.`;
    return this.sendSMS(data.to, message);
  }
}
