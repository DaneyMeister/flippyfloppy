import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const TONE_STYLES = {
  default: 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300',
  positive: 'bg-mint-500/10 text-mint-500',
  negative: 'bg-red-500/10 text-red-500',
};

export function SummaryCard({
  title,
  value,
  subtitle,
  tone = 'default',
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: ReactNode;
  tone?: 'default' | 'positive' | 'negative';
  icon?: LucideIcon;
}) {
  const valueColor =
    tone === 'positive'
      ? 'text-emerald-700 dark:text-emerald-400'
      : tone === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-900 dark:text-white';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {Icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONE_STYLES[tone]}`}>
            <Icon size={18} strokeWidth={2.25} />
          </span>
        )}
      </div>
      <p className={`mt-3 font-display text-2xl font-bold tracking-tight ${valueColor}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
}
