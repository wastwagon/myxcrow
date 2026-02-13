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
    const secure = this.configService.get<string>('EMAIL_SECURE') === 'true';
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST') || 'localhost',
      port: parseInt(this.configService.get<string>('EMAIL_PORT') || '1025', 10),
      secure,
      auth: this.configService.get<string>('EMAIL_USER')
        ? {
            user: this.configService.get<string>('EMAIL_USER'),
            pass: this.configService.get<string>('EMAIL_PASS') || '',
          }
        : undefined,
    });
  }

  /** Base HTML wrapper for branded emails */
  private getEmailWrapper(content: string, title?: string): string {
    const appName = 'MYXCROW';
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#6b2d2d,#4a1f1f);padding:24px;text-align:center">
      <span style="color:#d4af37;font-weight:700;font-size:24px">${appName}</span>
    </div>
    <div style="padding:32px 24px">
      ${title ? `<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px">${title}</h2>` : ''}
      <div style="color:#444;line-height:1.6;font-size:15px">${content}</div>
    </div>
    <div style="padding:16px 24px;background:#f9f9f9;text-align:center;color:#888;font-size:12px">
      © ${new Date().getFullYear()} ${appName}. Secure Escrow Services.
    </div>
  </div>
</body>
</html>`;
  }

  async sendEmail(to: string | string[], subject: string, html: string, useQueue: boolean = true, useWrapper: boolean = false) {
    const finalHtml = useWrapper ? this.getEmailWrapper(html, subject) : html;
    // Use queue if available, otherwise send directly
    if (useQueue && this.queueService) {
      try {
        await this.queueService.addEmailJob({
          to,
          subject,
          html: finalHtml,
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
        from: this.configService.get<string>('EMAIL_FROM') || 'noreply@myxcrow.com',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: finalHtml,
      });
      this.logger.log(`Email sent directly to ${Array.isArray(to) ? to.join(', ') : to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  async sendEscrowCreatedEmail(data: { to: string[]; escrowId: string; amount: string; currency: string }) {
    const content = `
      <p>An escrow has been created.</p>
      <p><strong>Escrow ID:</strong> ${data.escrowId}</p>
      <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
    `;
    await this.sendEmail(data.to, 'Escrow Created', content, true, true);
  }

  async sendEscrowFundedEmail(data: { to: string[]; escrowId: string; amount: string; currency: string }) {
    const content = `
      <p>Escrow ${data.escrowId} has been funded.</p>
      <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
    `;
    await this.sendEmail(data.to, 'Escrow Funded', content, true, true);
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
    const content = `
      <p>A dispute has been opened for escrow ${data.escrowId}.</p>
      <p><strong>Dispute ID:</strong> ${data.disputeId}</p>
    `;
    await this.sendEmail(data.to, 'Dispute Opened', content, true, true);
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

  async sendPasswordResetEmail(to: string, resetLink: string, expiresIn = '1 hour') {
    const content = `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}" style="display:inline-block;background:#6b2d2d;color:#fff!important;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Reset password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p style="color:#888;font-size:13px">This link expires in ${expiresIn}.</p>
    `;
    await this.sendEmail(to, 'Reset your MYXCROW password', this.getEmailWrapper(content, 'Reset your password'), false);
  }

  async sendPasswordChangedEmail(to: string) {
    const content = `
      <p>Your MYXCROW account password has been changed successfully.</p>
      <p>If you did not make this change, please contact support immediately.</p>
      <p style="color:#888;font-size:13px"><strong>Time:</strong> ${new Date().toISOString()}</p>
    `;
    await this.sendEmail(to, 'Password Changed Successfully', this.getEmailWrapper(content, 'Password Changed'), false);
  }

  async sendVerificationEmail(to: string, verifyLink: string, expiresIn = '24 hours') {
    const content = `
      <p>Welcome to MYXCROW! Please verify your email address to complete your registration.</p>
      <p><a href="${verifyLink}" style="display:inline-block;background:#6b2d2d;color:#fff!important;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Verify email</a></p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p style="color:#888;font-size:13px">This link expires in ${expiresIn}.</p>
    `;
    await this.sendEmail(to, 'Verify your MYXCROW email', this.getEmailWrapper(content, 'Verify your email'), false);
  }

  async sendAdminNewUserNotification(data: { userEmail: string; userId: string; role: string }) {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) return;
    const content = `
      <p>A new user has registered.</p>
      <p><strong>Email:</strong> ${data.userEmail}</p>
      <p><strong>User ID:</strong> ${data.userId}</p>
      <p><strong>Role:</strong> ${data.role}</p>
    `;
    await this.sendEmail(adminEmail, `[MYXCROW] New user: ${data.userEmail}`, this.getEmailWrapper(content, 'New user registered'), false);
  }

  async sendAdminKycPendingNotification(data: { userEmail: string; userId: string }) {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) return;
    const content = `
      <p>A user has submitted KYC for review.</p>
      <p><strong>Email:</strong> ${data.userEmail}</p>
      <p><strong>User ID:</strong> ${data.userId}</p>
    `;
    await this.sendEmail(adminEmail, `[MYXCROW] KYC pending review`, this.getEmailWrapper(content, 'KYC pending'), false);
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

