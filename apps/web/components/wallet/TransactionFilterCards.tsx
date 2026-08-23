import {
  FilterCards,
  type FilterCardOption,
} from '@/components/ui/FilterCards';

export type TransactionFilter = 'topups' | 'withdrawals';
export type TransactionFilterOption = FilterCardOption<TransactionFilter>;

export function TransactionFilterCards({
  options,
  value,
  onChange,
}: {
  options: TransactionFilterOption[];
  value: TransactionFilter;
  onChange: (value: TransactionFilter) => void;
}) {
  return <FilterCards options={options} value={value} onChange={onChange} columns={2} />;
}
