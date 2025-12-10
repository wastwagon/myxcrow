import { Injectable } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { formatCurrency } from '../../common/utils/format-currency';

@Injectable()
export class EscrowExportService {
  constructor(private escrowService: EscrowService) {}

  /**
   * Export escrows to CSV format
   */
  async exportEscrowsToCsv(filters?: {
    userId?: string;
    role?: 'buyer' | 'seller';
    status?: string;
    search?: string;
    counterpartyEmail?: string;
    minAmount?: number;
    maxAmount?: number;
    currency?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<string> {
    const result = await this.escrowService.listEscrows({
      userId: filters?.userId,
      role: filters?.role,
      status: filters?.status as any, // Type cast for export flexibility
      search: filters?.search,
      counterpartyEmail: filters?.counterpartyEmail,
      minAmount: filters?.minAmount,
      maxAmount: filters?.maxAmount,
      currency: filters?.currency,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      limit: 10000, // Large limit for export
      offset: 0,
    });

    const headers = [
      'ID',
      'Status',
      'Buyer Email',
      'Seller Email',
      'Amount',
      'Currency',
      'Fee',
      'Net Amount',
      'Description',
      'Created At',
      'Funded At',
      'Shipped At',
      'Delivered At',
      'Released At',
    ];

    const escrows = result.data || result.escrows || [];
    const rows = escrows.map((escrow: any) => [
      escrow.id,
      escrow.status,
      escrow.buyer?.email || '',
      escrow.seller?.email || '',
      (escrow.amountCents / 100).toFixed(2),
      escrow.currency || 'GHS',
      (escrow.feeCents / 100).toFixed(2),
      (escrow.netAmountCents / 100).toFixed(2),
      (escrow.description || '').replace(/,/g, ';'), // Replace commas in description
      escrow.createdAt ? new Date(escrow.createdAt).toISOString() : '',
      escrow.fundedAt ? new Date(escrow.fundedAt).toISOString() : '',
      escrow.shippedAt ? new Date(escrow.shippedAt).toISOString() : '',
      escrow.deliveredAt ? new Date(escrow.deliveredAt).toISOString() : '',
      escrow.releasedAt ? new Date(escrow.releasedAt).toISOString() : '',
    ]);

    // CSV formatting
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}

