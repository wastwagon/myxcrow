import { formatMethodLabel } from '../wallet/withdrawal-payout.util';

function withdrawalRef(withdrawalId: string): string {
  return withdrawalId.slice(0, 8);
}

export function withdrawalRequestedAdminSms(data: {
  userEmail: string;
  userPhone: string | null;
  amount: string;
  withdrawalId: string;
  methodType: string;
}): string {
  const userLabel = data.userEmail || data.userPhone || 'Unknown user';
  const ref = withdrawalRef(data.withdrawalId);
  const method = formatMethodLabel(data.methodType);
  return `MYXCROW Admin: New withdrawal ${data.amount} from ${userLabel} via ${method}. Ref ${ref}. Review in admin panel.`;
}

export function withdrawalRequestedUserSms(data: {
  amount: string;
  withdrawalId: string;
}): string {
  const ref = withdrawalRef(data.withdrawalId);
  return `MYXCROW: Withdrawal request of ${data.amount} received. Status: pending review. Ref ${ref}.`;
}

export function withdrawalRequestedUserEmailHtml(data: {
  amount: string;
  withdrawalId: string;
}): string {
  const ref = withdrawalRef(data.withdrawalId);
  return `
    <h2>Withdrawal Request Received</h2>
    <p>We received your withdrawal request for <strong>${data.amount}</strong>.</p>
    <p>Status: <strong>Pending review</strong></p>
    <p>Reference: ${ref}</p>
    <p>You will be notified when the request is processed.</p>
  `;
}

export function withdrawalApprovedSms(data: { amount: string; currency: string }): string {
  return `MYXCROW: Your withdrawal of ${data.amount} ${data.currency} has been approved. Funds will be processed shortly.`;
}

export function withdrawalApprovedEmailHtml(data: { amount: string; currency: string }): string {
  return `
    <h2>Withdrawal Approved</h2>
    <p>Your withdrawal request has been approved.</p>
    <p>Amount: ${data.amount} ${data.currency}</p>
  `;
}

export function withdrawalDeniedSms(data: {
  amount: string;
  currency: string;
  reason: string;
}): string {
  return `MYXCROW: Your withdrawal of ${data.amount} ${data.currency} was denied. Reason: ${data.reason}. Contact support for assistance.`;
}

export function withdrawalDeniedEmailHtml(data: {
  amount: string;
  currency: string;
  reason: string;
}): string {
  return `
    <h2>Withdrawal Denied</h2>
    <p>Your withdrawal request has been denied.</p>
    <p>Amount: ${data.amount} ${data.currency}</p>
    <p>Reason: ${data.reason}</p>
  `;
}

export function passwordResetSms(resetLink: string): string {
  return `MYXCROW: Reset your password here (expires in 1 hour): ${resetLink}`;
}

export function passwordChangedSms(): string {
  return 'MYXCROW: Your account password was changed successfully. If you did not do this, contact support immediately.';
}
