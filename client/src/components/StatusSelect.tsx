import { ChevronDown } from 'lucide-react';
import { ITEM_STATUSES, type ItemStatus } from '../types';

const STATUS_STYLES: Record<ItemStatus, string> = {
  SELLING: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-800',
  SOLD: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800',
  TESTER: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800',
  COLLECTION: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  USING: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:ring-sky-800',
  DEFECTIVE: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-900/40 dark:text-red-200 dark:ring-red-800',
};

export function StatusSelect({
  status,
  onChange,
  disabled,
}: {
  status: ItemStatus | string;
  onChange: (status: ItemStatus) => void;
  disabled?: boolean;
}) {
  const style = STATUS_STYLES[status as ItemStatus] ?? 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200';

  return (
    <div className={`relative inline-flex items-center rounded-full text-xs font-semibold ${style} ${disabled ? 'opacity-50' : ''}`}>
      <span className="pointer-events-none absolute left-2.5 h-1.5 w-1.5 rounded-full bg-current" />
      <select
        value={status}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as ItemStatus)}
        className="appearance-none rounded-full bg-transparent py-1 pl-6 pr-6 text-xs font-semibold outline-none disabled:cursor-not-allowed"
      >
        {ITEM_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
            {s}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2" />
    </div>
  );
}
