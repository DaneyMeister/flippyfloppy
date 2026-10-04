import type { ReactNode } from 'react';
import { formatPhp } from '../utils/format';

const tileClass =
  'rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900';

/** Small rounded badge for plain context next to a figure. */
function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-1 py-px text-[9px] font-semibold tracking-tight md:tracking-normal text-slate-500 md:px-2.5 md:py-0.5 md:text-xs dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Compact stat for the side stack: label over value with a context pill
 * pinned to the tile's right edge. On phones (half the screen wide) the pill
 * stays on the value's line, shrunk to fit, and truncates rather than wrap
 * if it still can't; from tablet up it's centred on the tile's right. At lg
 * the tiles are a narrow column again, so they go back to the phone
 * arrangement (title gets the full width) until xl.
 */
export function StatTile({ title, value, pill }: { title: string; value: string; pill: ReactNode }) {
  return (
    <div className={`${tileClass} flex items-center justify-between gap-3 px-2.5 py-2 md:px-5 md:py-4 lg:px-4 xl:px-5`}>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-500 md:text-sm dark:text-slate-400">{title}</p>
        <div className="mt-0.5 flex items-center justify-between gap-1 md:mt-1">
          <p className="shrink-0 font-display text-[15px] font-bold tracking-tight text-slate-900 md:text-2xl lg:text-xl xl:text-2xl dark:text-white">{value}</p>
          <Pill className="ml-auto inline-block min-w-0 truncate md:hidden lg:inline-block lg:px-1.5 lg:text-[10px] xl:hidden">{pill}</Pill>
        </div>
      </div>
      <Pill className="hidden md:inline-flex lg:hidden xl:inline-flex">{pill}</Pill>
    </div>
  );
}

/**
 * Phone font size for the Net Profit figure, which only gets half the screen.
 * Steps down as the amount gains digits (up to 5, 6, then 7+) and scales with
 * the screen width, so the longest amount still fits on a small phone.
 */
function netProfitSize(value: number) {
  const digits = String(Math.trunc(Math.abs(value))).length;
  if (digits <= 5) return 'text-[clamp(1.75rem,8.5vw,2.5rem)]';
  if (digits === 6) return 'text-[clamp(1.5rem,6.8vw,2.125rem)]';
  return 'text-[clamp(1.25rem,5.6vw,1.75rem)]';
}

/**
 * Stats row shared by Dashboard and Monthly Summary.
 *
 * Phones: Net Profit / Loss card and the three tiles side by side, chart in
 * its own card underneath; the card's content is centred so the height it
 * borrows from the tile stack doesn't pool as one gap in the middle. Tablet: Net Profit card full width with the chart
 * beside the number, tiles below. Desktop: Net Profit card two-thirds wide,
 * tiles stacked beside it; at lg the chart squeezes the card, so the figure
 * steps down a size and the breakdown stacks, until xl gives room back.
 */
export function StatsLayout({
  netProfit,
  subline,
  breakdown,
  chart,
  tiles,
}: {
  netProfit: number;
  subline: ReactNode;
  breakdown: { label: string; value: ReactNode }[];
  chart: ReactNode;
  tiles: ReactNode;
}) {
  const positive = netProfit >= 0;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-4 lg:grid-cols-3">
      <div
        className={`flex flex-col justify-center rounded-2xl border bg-white p-3 md:justify-start shadow-sm shadow-slate-900/[0.03] md:p-7 lg:col-span-2 dark:bg-slate-900 ${
          positive ? 'border-emerald-500/25' : 'border-red-500/25'
        }`}
      >
        <div className="grid grid-cols-1 gap-8 md:flex-1 md:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex flex-col">
            <div className="pb-3 md:pb-6">
              <p className="text-[11px] font-medium text-slate-500 md:text-sm dark:text-slate-400">Net Profit / Loss</p>
              <p
                className={`mt-1 whitespace-nowrap font-display font-extrabold leading-tight tracking-tight md:mt-2 md:text-6xl lg:text-4xl xl:text-6xl ${netProfitSize(netProfit)} ${
                  positive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatPhp(netProfit)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 md:mt-3 md:text-sm dark:text-slate-400">{subline}</p>
            </div>

            <div className="grid grid-cols-1 gap-1.5 border-t border-slate-200 pt-3 md:mt-auto md:max-w-md md:grid-cols-2 md:gap-6 md:pt-5 lg:grid-cols-1 lg:gap-3 xl:grid-cols-2 xl:gap-6 dark:border-slate-800">
              {breakdown.map((b) => (
                // Phones: label and value on one line. Tablet up: value under its label.
                <div key={b.label} className="flex min-w-0 items-baseline justify-between gap-1.5 md:block">
                  <p className="truncate text-[10px] text-slate-500 md:text-sm dark:text-slate-400">{b.label}</p>
                  <p className="shrink-0 font-display text-[13px] font-bold text-slate-900 md:mt-1 md:text-xl dark:text-white">{b.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:grid">{chart}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:gap-4">{tiles}</div>

      <div className={`${tileClass} col-span-2 p-4 md:hidden`}>{chart}</div>
    </div>
  );
}
