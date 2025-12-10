import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { QueueService } from '../../common/queue/queue.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => QueueService))
    private queueService?: QueueService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST') || 'mailpit',
      port: parseInt(this.configService.get<string>('EMAIL_PORT') || '1025', 10),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER') || '',
        pass: this.configService.get<string>('EMAIL_PASS') || '',
      },
    });
  }

  async sendEmail(to: string | string[], subject: string, html: string, useQueue: boolean = true) {
    // Use queue if available, otherwise send directly
    if (useQueue && this.queueService) {
      try {
        await this.queueService.addEmailJob({
          to,
          subject,
          html,
        });
        this.logger.log(`Email queued for ${Array.isArray(to) ? to.join(', ') : to}`);
        return;
      } catch (error: any) {
        this.logger.warn(`Failed to queue email, sending directly: ${error.message}`);
      }
    }

    // Fallback to direct send
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM') || 'noreply@escrow.com',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
      });
      this.logger.log(`Email sent directly to ${Array.isArray(to) ? to.join(', ') : to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  async sendEscrowCreatedEmail(data: { to: string[]; escrowId: string; amount: string; currency: string }) {
    const html = `
      <h2>Escrow Created</h2>
      <p>An escrow has been created: ${data.escrowId}</p>
      <p>Amount: ${data.amount} ${data.currency}</p>
    `;
    await this.sendEmail(data.to, 'Escrow Created', html);
  }

  async sendEscrowFundedEmail(data: { to: string[]; escrowId: string; amount: string; currency: string }) {
    const html = `
      <h2>Escrow Funded</h2>
      <p>Escrow ${data.escrowId} has been funded.</p>
      <p>Amount: ${data.amount} ${data.currency}</p>
    `;
    await this.sendEmail(data.to, 'Escrow Funded', html);
  }

  async sendEscrowShippedEmail(data: { to: string[]; escrowId: string }) {
    const html = `
      <h2>Escrow Shipped</h2>
      <p>Escrow ${data.escrowId} has been marked as shipped.</p>
    `;
    await this.sendEmail(data.to, 'Escrow Shipped', html);
  }

  async sendEscrowDeliveredEmail(data: { to: string[]; escrowId: string }) {
    const html = `
      <h2>Escrow Delivered</h2>
      <p>Escrow ${data.escrowId} has been marked as delivered.</p>
    `;
    await this.sendEmail(data.to, 'Escrow Delivered', html);
  }

  async sendEscrowReleasedEmail(data: { to: string[]; escrowId: string; amount: string; currency: string }) {
    const html = `
      <h2>Funds Released</h2>
      <p>Funds for escrow ${data.escrowId} have been released.</p>
      <p>Amount: ${data.amount} ${data.currency}</p>
    `;
    await this.sendEmail(data.to, 'Funds Released', html);
  }

  async sendDisputeOpenedEmail(data: { to: string[]; escrowId: string; disputeId: string }) {
    const html = `
      <h2>Dispute Opened</h2>
      <p>A dispute has been opened for escrow ${data.escrowId}.</p>
      <p>Dispute ID: ${data.disputeId}</p>
    `;
    await this.sendEmail(data.to, 'Dispute Opened', html);
  }

  async sendDisputeResolvedEmail(data: { to: string[]; escrowId: string; disputeId: string }) {
    const html = `
      <h2>Dispute Resolved</h2>
      <p>Dispute ${data.disputeId} for escrow ${data.escrowId} has been resolved.</p>
    `;
    await this.sendEmail(data.to, 'Dispute Resolved', html);
  }

  async sendWalletTopUpEmail(data: { to: string; amount: string; currency: string; status: string }) {
    const html = `
      <h2>Wallet Top-Up ${data.status === 'SUCCEEDED' ? 'Successful' : 'Pending'}</h2>
      <p>Amount: ${data.amount} ${data.currency}</p>
      <p>Status: ${data.status}</p>
    `;
    await this.sendEmail(data.to, 'Wallet Top-Up', html);
  }

  async sendWithdrawalApprovedEmail(data: { to: string; amount: string; currency: string }) {
    const html = `
      <h2>Withdrawal Approved</h2>
      <p>Your withdrawal request has been approved.</p>
      <p>Amount: ${data.amount} ${data.currency}</p>
    `;
    await this.sendEmail(data.to, 'Withdrawal Approved', html);
  }

  async sendWithdrawalDeniedEmail(data: { to: string; amount: string; currency: string; reason: string }) {
    const html = `
      <h2>Withdrawal Denied</h2>
      <p>Your withdrawal request has been denied.</p>
      <p>Amount: ${data.amount} ${data.currency}</p>
      <p>Reason: ${data.reason}</p>
    `;
    await this.sendEmail(data.to, 'Withdrawal Denied', html);
  }

  async sendWalletCreditEmail(data: {
    to: string;
    amount: string;
    currency: string;
    description: string;
    reference?: string;
    newBalance: string;
  }) {
    const html = `
      <h2>Wallet Credited</h2>
      <p>Your wallet has been credited with <strong>${data.amount} ${data.currency}</strong>.</p>
      <p><strong>Description:</strong> ${data.description}</p>
      ${data.reference ? `<p><strong>Reference:</strong> ${data.reference}</p>` : ''}
      <p><strong>New Balance:</strong> ${data.newBalance} ${data.currency}</p>
      <p>This was a manual adjustment made by an administrator.</p>
    `;
    await this.sendEmail(data.to, 'Wallet Credited', html);
  }

  async sendWalletDebitEmail(data: {
    to: string;
    amount: string;
    currency: string;
    description: string;
    reference?: string;
    newBalance: string;
  }) {
    const html = `
      <h2>Wallet Debited</h2>
      <p>Your wallet has been debited <strong>${data.amount} ${data.currency}</strong>.</p>
      <p><strong>Description:</strong> ${data.description}</p>
      ${data.reference ? `<p><strong>Reference:</strong> ${data.reference}</p>` : ''}
      <p><strong>New Balance:</strong> ${data.newBalance} ${data.currency}</p>
      <p>This was a manual adjustment made by an administrator.</p>
    `;
    await this.sendEmail(data.to, 'Wallet Debited', html);
  }
}

