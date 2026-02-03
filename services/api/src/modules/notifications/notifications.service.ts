import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { SMSService } from './sms.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private emailService: EmailService,
    private smsService: SMSService,
  ) {}

  /**
   * Send both email and SMS notifications
   */
  async sendNotifications(options: {
    emails?: { to: string | string[]; subject: string; html: string };
    sms?: { to: string | string[]; message: string };
  }) {
    const promises: Promise<any>[] = [];

    if (options.emails) {
      promises.push(
        this.emailService
          .sendEmail(options.emails.to, options.emails.subject, options.emails.html)
          .catch((error) => {
            this.logger.error(`Failed to send email: ${error.message}`);
          }),
      );
    }

    if (options.sms) {
      promises.push(
        this.smsService
          .sendSMS(options.sms.to, options.sms.message)
          .catch((error) => {
            this.logger.error(`Failed to send SMS: ${error.message}`);
          }),
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send escrow created notifications
   */
  async sendEscrowCreatedNotifications(data: {
    emails: string[];
    phones: string[];
    escrowId: string;
    amount: string;
    currency: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.emails,
        subject: 'Escrow Created',
        html: `
          <h2>Escrow Created</h2>
          <p>An escrow has been created: ${data.escrowId}</p>
          <p>Amount: ${data.amount} ${data.currency}</p>
        `,
      },
      sms: {
        to: data.phones,
        message: `MYXCROW: Escrow ${data.escrowId} created. Amount: ${data.amount} ${data.currency}. Check your dashboard for details.`,
      },
    });
  }

  /**
   * Send escrow funded notifications
   */
  async sendEscrowFundedNotifications(data: {
    emails: string[];
    phones: string[];
    escrowId: string;
    amount: string;
    currency: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.emails,
        subject: 'Escrow Funded',
        html: `
          <h2>Escrow Funded</h2>
          <p>Escrow ${data.escrowId} has been funded.</p>
          <p>Amount: ${data.amount} ${data.currency}</p>
        `,
      },
      sms: {
        to: data.phones,
        message: `MYXCROW: Escrow ${data.escrowId} funded with ${data.amount} ${data.currency}. Funds are secured.`,
      },
    });
  }

  /**
   * Send escrow shipped notifications
   */
  async sendEscrowShippedNotifications(data: {
    emails: string[];
    phones: string[];
    escrowId: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.emails,
        subject: 'Escrow Shipped',
        html: `
          <h2>Escrow Shipped</h2>
          <p>Escrow ${data.escrowId} has been marked as shipped.</p>
        `,
      },
      sms: {
        to: data.phones,
        message: `MYXCROW: Escrow ${data.escrowId} has been marked as shipped. Track delivery on your dashboard.`,
      },
    });
  }

  /**
   * Send delivery verification code to buyer only (recipient). Only buyer and system know this code;
   * delivery person gets it from recipient and enters it to confirm delivery (signature validation).
   */
  async sendDeliveryCodeToBuyer(data: {
    buyerEmail: string;
    buyerPhone: string | null;
    escrowId: string;
    deliveryCode: string;
    shortReference: string;
    confirmDeliveryUrl: string;
  }) {
    const fullUrl = `${data.confirmDeliveryUrl}?ref=${encodeURIComponent(data.shortReference)}`;
    await this.sendNotifications({
      emails: {
        to: data.buyerEmail,
        subject: 'Your delivery verification code - MYXCROW',
        html: `
          <h2>Delivery verification code</h2>
          <p>Escrow ${data.escrowId} has been shipped. Use this code to confirm delivery (give it to the delivery person so they can enter it, or confirm yourself).</p>
          <p><strong>Reference:</strong> ${data.shortReference}</p>
          <p><strong>Code:</strong> ${data.deliveryCode}</p>
          <p>Confirm delivery here: <a href="${fullUrl}">${fullUrl}</a></p>
        `,
      },
      sms: data.buyerPhone
        ? {
            to: [data.buyerPhone],
            message: `MYXCROW: Delivery code for escrow ${data.escrowId}: Ref ${data.shortReference}, Code ${data.deliveryCode}. Give code to delivery person or confirm at ${data.confirmDeliveryUrl}`,
          }
        : undefined,
    });
  }

  /**
   * Send escrow delivered notifications
   */
  async sendEscrowDeliveredNotifications(data: {
    emails: string[];
    phones: string[];
    escrowId: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.emails,
        subject: 'Escrow Delivered',
        html: `
          <h2>Escrow Delivered</h2>
          <p>Escrow ${data.escrowId} has been marked as delivered.</p>
        `,
      },
      sms: {
        to: data.phones,
        message: `MYXCROW: Escrow ${data.escrowId} has been delivered. Please confirm receipt to release funds.`,
      },
    });
  }

  /**
   * Send escrow released notifications
   */
  async sendEscrowReleasedNotifications(data: {
    emails: string[];
    phones: string[];
    escrowId: string;
    amount: string;
    currency: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.emails,
        subject: 'Funds Released',
        html: `
          <h2>Funds Released</h2>
          <p>Funds for escrow ${data.escrowId} have been released.</p>
          <p>Amount: ${data.amount} ${data.currency}</p>
        `,
      },
      sms: {
        to: data.phones,
        message: `MYXCROW: Funds for escrow ${data.escrowId} have been released. Amount: ${data.amount} ${data.currency}.`,
      },
    });
  }

  /**
   * Send dispute opened notifications
   */
  async sendDisputeOpenedNotifications(data: {
    emails: string[];
    phones: string[];
    escrowId: string;
    disputeId: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.emails,
        subject: 'Dispute Opened',
        html: `
          <h2>Dispute Opened</h2>
          <p>A dispute has been opened for escrow ${data.escrowId}.</p>
          <p>Dispute ID: ${data.disputeId}</p>
        `,
      },
      sms: {
        to: data.phones,
        message: `MYXCROW: A dispute has been opened for escrow ${data.escrowId}. Dispute ID: ${data.disputeId}. We'll review and resolve it.`,
      },
    });
  }

  /**
   * Send dispute resolved notifications
   */
  async sendDisputeResolvedNotifications(data: {
    emails: string[];
    phones: string[];
    escrowId: string;
    disputeId: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.emails,
        subject: 'Dispute Resolved',
        html: `
          <h2>Dispute Resolved</h2>
          <p>Dispute ${data.disputeId} for escrow ${data.escrowId} has been resolved.</p>
        `,
      },
      sms: {
        to: data.phones,
        message: `MYXCROW: Dispute ${data.disputeId} for escrow ${data.escrowId} has been resolved. Check your dashboard for details.`,
      },
    });
  }

  /**
   * Send wallet top-up notifications
   */
  async sendWalletTopUpNotifications(data: {
    email: string;
    phone: string;
    amount: string;
    currency: string;
    status: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.email,
        subject: 'Wallet Top-Up',
        html: `
          <h2>Wallet Top-Up ${data.status === 'SUCCEEDED' ? 'Successful' : 'Pending'}</h2>
          <p>Amount: ${data.amount} ${data.currency}</p>
          <p>Status: ${data.status}</p>
        `,
      },
      sms: {
        to: data.phone,
        message: `MYXCROW: Wallet top-up ${data.status === 'SUCCEEDED' ? 'successful' : 'pending'}. Amount: ${data.amount} ${data.currency}.`,
      },
    });
  }

  /**
   * Send withdrawal approved notifications
   */
  async sendWithdrawalApprovedNotifications(data: {
    email: string;
    phone: string;
    amount: string;
    currency: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.email,
        subject: 'Withdrawal Approved',
        html: `
          <h2>Withdrawal Approved</h2>
          <p>Your withdrawal request has been approved.</p>
          <p>Amount: ${data.amount} ${data.currency}</p>
        `,
      },
      sms: {
        to: data.phone,
        message: `MYXCROW: Your withdrawal of ${data.amount} ${data.currency} has been approved. Funds will be processed shortly.`,
      },
    });
  }

  /**
   * Send withdrawal denied notifications
   */
  async sendWithdrawalDeniedNotifications(data: {
    email: string;
    phone: string;
    amount: string;
    currency: string;
    reason: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.email,
        subject: 'Withdrawal Denied',
        html: `
          <h2>Withdrawal Denied</h2>
          <p>Your withdrawal request has been denied.</p>
          <p>Amount: ${data.amount} ${data.currency}</p>
          <p>Reason: ${data.reason}</p>
        `,
      },
      sms: {
        to: data.phone,
        message: `MYXCROW: Your withdrawal of ${data.amount} ${data.currency} was denied. Reason: ${data.reason}. Contact support for assistance.`,
      },
    });
  }

  /**
   * Send KYC status update notifications
   */
  async sendKYCStatusUpdateNotifications(data: {
    email: string;
    phone: string;
    status: string;
  }) {
    const statusText = data.status === 'APPROVED' ? 'approved' : data.status === 'REJECTED' ? 'rejected' : 'pending';
    await this.sendNotifications({
      emails: {
        to: data.email,
        subject: 'KYC Status Update',
        html: `
          <h2>KYC Status Update</h2>
          <p>Your KYC verification has been ${statusText}.</p>
        `,
      },
      sms: {
        to: data.phone,
        message: `MYXCROW: Your KYC verification has been ${statusText}. Check your dashboard for details.`,
      },
    });
  }

  /**
   * Send payment confirmation notifications
   */
  async sendPaymentConfirmationNotifications(data: {
    email: string;
    phone: string;
    amount: string;
    currency: string;
    reference: string;
  }) {
    await this.sendNotifications({
      emails: {
        to: data.email,
        subject: 'Payment Confirmed',
        html: `
          <h2>Payment Confirmed</h2>
          <p>Amount: ${data.amount} ${data.currency}</p>
          <p>Reference: ${data.reference}</p>
        `,
      },
      sms: {
        to: data.phone,
        message: `MYXCROW: Payment confirmed. Amount: ${data.amount} ${data.currency}. Reference: ${data.reference}.`,
      },
    });
  }
}
