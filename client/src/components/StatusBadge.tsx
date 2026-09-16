import type { ItemStatus } from '../types';

const STATUS_STYLES: Record<ItemStatus, string> = {
  SELLING: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-800',
  SOLD: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800',
  TESTER: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800',
  COLLECTION: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  USING: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:ring-sky-800',
  DEFECTIVE: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-900/40 dark:text-red-200 dark:ring-red-800',
};

export function StatusBadge({ status }: { status: ItemStatus | string }) {
  const style = STATUS_STYLES[status as ItemStatus] ?? 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
