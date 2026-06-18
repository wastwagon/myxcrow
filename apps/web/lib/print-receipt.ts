import type { ReceiptData } from '@/lib/receipt-types';

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderReceiptHtml(receipt: ReceiptData): string {
  const printedAt = new Date().toLocaleString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const issuedAt = new Date(receipt.issuedAt).toLocaleString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const partyBlock = (title: string, party?: ReceiptData['accountHolder']) => {
    if (!party) return '';
    return `
      <div class="party">
        <p class="party-label">${escapeHtml(title)}</p>
        ${party.name ? `<p class="party-name">${escapeHtml(party.name)}</p>` : ''}
        ${party.email ? `<p class="party-meta">${escapeHtml(party.email)}</p>` : ''}
        ${party.phone ? `<p class="party-meta">${escapeHtml(party.phone)}</p>` : ''}
        ${party.userId ? `<p class="party-id">ID: ${escapeHtml(party.userId)}</p>` : ''}
      </div>
    `;
  };

  const amountRows = receipt.amountLines
    .map(
      (line) => `
      <tr class="${line.emphasize ? 'total-row' : ''}">
        <td>${escapeHtml(line.label)}</td>
        <td class="amount">${formatMoney(line.amountCents, receipt.currency)}</td>
      </tr>
    `,
    )
    .join('');

  const sections = receipt.sections
    .map(
      (section) => `
      <div class="section">
        ${section.title ? `<h3>${escapeHtml(section.title)}</h3>` : ''}
        <table class="details">
          <tbody>
            ${section.rows
              .map(
                (row) => `
              <tr>
                <td class="detail-label">${escapeHtml(row.label)}</td>
                <td class="detail-value">${escapeHtml(row.value)}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `,
    )
    .join('');

  const notes = (receipt.notes || [])
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>MYXCROW Receipt — ${escapeHtml(receipt.receiptNumber.slice(0, 8))}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1a1214;
      background: #fff;
      padding: 32px;
      font-size: 13px;
      line-height: 1.5;
    }
    .receipt {
      max-width: 720px;
      margin: 0 auto;
      border: 1px solid #e8dfd0;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #59191f 0%, #331518 100%);
      color: #fff;
      padding: 28px 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }
    .brand { flex: 1; }
    .brand-name {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #d0ab63;
    }
    .brand-tagline {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      opacity: 0.85;
      margin-top: 4px;
    }
    .receipt-title {
      text-align: right;
      font-size: 12px;
      opacity: 0.9;
    }
    .receipt-title strong {
      display: block;
      font-size: 16px;
      margin-bottom: 4px;
      color: #fff;
    }
    .admin-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(208, 171, 99, 0.25);
      color: #f5e6c8;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 20px 32px;
      background: #faf7f2;
      border-bottom: 1px solid #ece4d6;
    }
    .meta-item label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7a6a5c;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .meta-item span {
      font-weight: 600;
      color: #2a1f22;
      word-break: break-all;
    }
    .status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      background: #e8f5ee;
      color: #1d6b42;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .body { padding: 24px 32px 32px; }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .party {
      border: 1px solid #ece4d6;
      border-radius: 8px;
      padding: 14px 16px;
      background: #fff;
    }
    .party-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7a6a5c;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .party-name { font-weight: 700; font-size: 14px; color: #2a1f22; }
    .party-meta { color: #5c4f52; font-size: 12px; margin-top: 2px; }
    .party-id { font-family: ui-monospace, monospace; font-size: 10px; color: #8a7a6c; margin-top: 6px; }
    .amount-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .amount-table th {
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7a6a5c;
      padding: 10px 0;
      border-bottom: 2px solid #d0ab63;
    }
    .amount-table td {
      padding: 10px 0;
      border-bottom: 1px solid #f0ebe3;
    }
    .amount-table .amount {
      text-align: right;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .amount-table .total-row td {
      font-weight: 800;
      font-size: 15px;
      border-bottom: none;
      padding-top: 14px;
      color: #59191f;
    }
    .section { margin-bottom: 20px; }
    .section h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #59191f;
      margin-bottom: 8px;
      font-weight: 800;
    }
    .details { width: 100%; border-collapse: collapse; }
    .details td {
      padding: 7px 0;
      border-bottom: 1px solid #f5f0e8;
      vertical-align: top;
    }
    .detail-label {
      width: 38%;
      color: #7a6a5c;
      font-size: 12px;
      padding-right: 12px;
    }
    .detail-value {
      font-weight: 500;
      color: #2a1f22;
      word-break: break-word;
    }
    .notes {
      margin-top: 20px;
      padding: 14px 16px;
      background: #faf7f2;
      border-radius: 8px;
      border: 1px solid #ece4d6;
    }
    .notes h4 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7a6a5c;
      margin-bottom: 8px;
    }
    .notes ul {
      padding-left: 18px;
      color: #5c4f52;
      font-size: 11px;
    }
    .notes li { margin-bottom: 4px; }
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #ece4d6;
      text-align: center;
      color: #8a7a6c;
      font-size: 10px;
    }
    .footer strong { color: #59191f; }
    @media print {
      body { padding: 0; }
      .receipt { border: none; border-radius: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="brand">
        <div class="brand-name">MYXCROW</div>
        <div class="brand-tagline">Secure escrow &amp; payments · Ghana</div>
      </div>
      <div class="receipt-title">
        <strong>${escapeHtml(receipt.transactionTitle)}</strong>
        <span>Official transaction record</span>
        ${receipt.isAdminCopy ? '<div class="admin-badge">Admin copy</div>' : ''}
      </div>
    </div>
    <div class="meta">
      <div class="meta-item">
        <label>Receipt no.</label>
        <span>${escapeHtml(receipt.receiptNumber)}</span>
      </div>
      <div class="meta-item">
        <label>Issued</label>
        <span>${escapeHtml(issuedAt)}</span>
      </div>
      <div class="meta-item">
        <label>Status</label>
        <span class="status">${escapeHtml(receipt.statusLabel)}</span>
      </div>
    </div>
    <div class="body">
      ${
        receipt.accountHolder || receipt.counterparty
          ? `<div class="parties">
              ${partyBlock('Account holder', receipt.accountHolder)}
              ${partyBlock('Counterparty', receipt.counterparty)}
            </div>`
          : ''
      }
      <table class="amount-table">
        <thead>
          <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
        </thead>
        <tbody>${amountRows}</tbody>
      </table>
      ${sections}
      ${
        notes
          ? `<div class="notes"><h4>Important notes</h4><ul>${notes}</ul></div>`
          : ''
      }
      <div class="footer">
        <p>Generated by <strong>MYXCROW</strong> on ${escapeHtml(printedAt)}</p>
        <p style="margin-top:4px">This document is system-generated. For support, contact MYXCROW customer service.</p>
      </div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
}

export function printReceiptDocument(receipt: ReceiptData): void {
  if (typeof window === 'undefined') return;

  const html = renderReceiptHtml(receipt);
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');

  if (!printWindow) {
    window.alert('Please allow pop-ups to print receipts.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
