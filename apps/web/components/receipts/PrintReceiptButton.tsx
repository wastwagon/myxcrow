import { Printer } from 'lucide-react';
import type { ReceiptData } from '@/lib/receipt-types';
import { printReceiptDocument } from '@/lib/print-receipt';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PrintReceiptButtonProps extends ButtonProps {
  receipt: ReceiptData;
  label?: string;
  iconOnly?: boolean;
}

export function PrintReceiptButton({
  receipt,
  label = 'Print receipt',
  iconOnly = false,
  className,
  variant = 'outline',
  size = 'sm',
  onClick,
  ...props
}: PrintReceiptButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(iconOnly && 'min-w-[44px] px-2.5', className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        printReceiptDocument(receipt);
        onClick?.(e);
      }}
      title={iconOnly ? label : undefined}
      aria-label={iconOnly ? label : undefined}
      {...props}
    >
      <Printer className={cn('shrink-0', iconOnly ? 'w-4 h-4' : 'w-4 h-4')} />
      {!iconOnly && <span>{label}</span>}
    </Button>
  );
}
