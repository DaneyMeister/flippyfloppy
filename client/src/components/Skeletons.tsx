import type { ReactNode } from 'react';
import { cardClass, cardSurfaceClass } from './FormField';

/**
 * Skeleton loading screens. Each one copies the real screen's cards, tables
 * and lists (same classes, same grid), so nothing jumps when the data lands.
 * The shimmer itself is the .skeleton class in index.css.
 */

/** One grey placeholder shape. Size it with Tailwind classes. */
export function Bone({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

const repeat = (n: number) => Array.from({ length: n }, (_, i) => i);

/**
 * Announces loading to screen readers (the bones are aria-hidden). The label
 * goes last so it can't shift the first shape in a space-y stack.
 */
function Loading({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Same frame as SummaryCard: title + icon tile, big value, subtitle. */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <Bone className="mt-1 h-3.5 w-28" />
        <Bone className="h-9 w-9 shrink-0 rounded-xl" />
      </div>
      <Bone className="mt-3 h-7 w-32" />
      <Bone className="mt-2 h-3 w-24" />
    </div>
  );
}

function StatRow({ count, className }: { count: number; className: string }) {
  return (
    <div className={className}>
      {repeat(count).map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Same frame as a Dashboard group card: name + type pill, meta line, progress bar, 3 figures. */
function GroupCardSkeleton() {
  return (
    <div className={`${cardClass} flex flex-col`}>
      <div className="flex items-start justify-between gap-2">
        <Bone className="h-5 w-32" />
        <Bone className="h-5 w-20 rounded-full" />
      </div>
      <Bone className="mt-2 h-3 w-44" />
      <Bone className="mt-4 h-1.5 w-full rounded-full" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {repeat(3).map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Bone className="h-3 w-10" />
            <Bone className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Same frame as StatsLayout (Dashboard, Monthly Summary): Net Profit card and
 * three tiles side by side on phones with the chart card below; chart inside
 * the Net Profit card from tablet up.
 */
function StatsSkeleton() {
  const card = 'rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900';
  const chart = (
    <div className="flex min-h-[200px] flex-col">
      <Bone className="h-3.5 w-36" />
      <Bone className="mt-2 min-h-[180px] w-full flex-1 rounded-xl" />
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-4 lg:grid-cols-3">
      <div className={`${card} grid grid-cols-1 content-center gap-8 p-3 md:content-stretch md:grid-cols-[auto_minmax(0,1fr)] md:p-7 lg:col-span-2`}>
        <div className="flex flex-col">
          <div className="pb-3 md:pb-6">
            <Bone className="h-3 w-20 md:h-3.5 md:w-28" />
            <Bone className="mt-1.5 h-8 w-full max-w-28 md:mt-3 md:h-[60px] md:max-w-72 lg:h-10 lg:max-w-44 xl:h-[60px] xl:max-w-72" />
            <Bone className="mt-1.5 h-3 w-24 md:mt-3 md:h-4 md:w-36" />
          </div>
          <div className="grid grid-cols-1 gap-1.5 border-t border-slate-200 pt-3 md:mt-auto md:max-w-md md:grid-cols-2 md:gap-6 md:pt-5 lg:grid-cols-1 lg:gap-3 xl:grid-cols-2 xl:gap-6 dark:border-slate-800">
            {repeat(2).map((i) => (
              <div key={i} className="flex items-center justify-between gap-2 md:block md:space-y-2">
                <Bone className="h-3 w-16 md:h-3.5 md:w-24" />
                <Bone className="h-4 w-10 md:h-6 md:w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:grid">{chart}</div>
      </div>
      <div className="grid grid-cols-1 gap-2 md:gap-4">
        {repeat(3).map((i) => (
          <div
            key={i}
            className={`${card} flex items-center justify-between gap-3 px-2.5 py-2 md:px-5 md:py-4 lg:px-4 xl:px-5`}
          >
            <div className="w-full space-y-1.5 md:w-auto md:space-y-2 lg:w-full xl:w-auto">
              <Bone className="h-3 w-full max-w-24 md:h-3.5 md:w-28" />
              <div className="flex items-center gap-1.5">
                <Bone className="h-5 w-16 md:h-7 md:w-32" />
                <Bone className="ml-auto h-4 w-12 rounded-full md:hidden lg:block xl:hidden" />
              </div>
            </div>
            <Bone className="hidden h-6 w-20 shrink-0 rounded-full md:block lg:hidden xl:block" />
          </div>
        ))}
      </div>
      <div className={`${card} col-span-2 p-4 md:hidden`}>{chart}</div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading label="Loading dashboard…" className="space-y-8">
      <StatsSkeleton />
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Bone className="h-6 w-36" />
          <div className="flex items-center gap-3">
            <Bone className="h-4 w-16" />
            <Bone className="h-9 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {repeat(6).map((i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </Loading>
  );
}

/**
 * A data table on desktop and a stacked card list on phones, like the real
 * Inventory / Monthly Summary / Price Index lists. `columns` sets the width
 * of each desktop column's bone; the last column is right-aligned.
 * `tabletCards` keeps the cards (two per row) on tablets and shows the table
 * only from xl, matching Inventory.
 */
export function TableSkeleton({ columns, rows = 6, tabletCards = false }: { columns: string[]; rows?: number; tabletCards?: boolean }) {
  return (
    <>
      <div className={tabletCards ? 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden' : 'space-y-3 md:hidden'}>
        {repeat(tabletCards ? Math.min(rows, 6) : Math.min(rows, 4)).map((i) => (
          <div key={i} className={`${cardSurfaceClass} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
              <Bone className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-3 flex justify-between">
              <Bone className="h-3 w-24" />
              <Bone className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className={`${cardSurfaceClass} hidden overflow-hidden ${tabletCards ? 'xl:block' : 'md:block'}`}>
        <div className="flex gap-6 border-b border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-950">
          {columns.map((w, i) => (
            <Bone key={i} className={`h-3 ${w} ${i === columns.length - 1 ? 'ml-auto' : ''}`} />
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {repeat(rows).map((r) => (
            <div key={r} className="flex items-center gap-6 px-4 py-3.5">
              {columns.map((w, i) => (
                <Bone key={i} className={`h-4 ${w} ${i === columns.length - 1 ? 'ml-auto' : ''}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function InventorySkeleton() {
  return (
    <Loading label="Loading inventory…" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Bone className="h-10 w-full rounded-xl sm:max-w-xs" />
        <Bone className="h-10 w-full rounded-xl sm:w-40" />
        <Bone className="h-4 w-44 sm:ml-auto" />
      </div>
      {/* Name · Category · Group · Status · Cost · Purchased · Sold · delete */}
      <TableSkeleton columns={['w-48', 'w-16', 'w-28', 'w-20', 'w-16', 'w-20', 'w-20', 'w-5']} rows={8} tabletCards />
    </Loading>
  );
}

/** Monthly Summary below the month picker: Net Profit card + tiles, heading, sold-items list. */
export function MonthlySummarySkeleton() {
  return (
    <Loading label="Loading monthly summary…" className="space-y-6">
      <StatsSkeleton />
      <div>
        <Bone className="mb-4 h-6 w-36" />
        {/* Name · Category · Buyer · Sale Date · Sold Price */}
        <TableSkeleton columns={['w-56', 'w-16', 'w-32', 'w-24', 'w-16']} rows={6} />
      </div>
    </Loading>
  );
}

/** Price Index results while a search runs: 3 stat cards, heading, history table. */
export function PriceIndexSkeleton() {
  return (
    <Loading label="Searching…" className="space-y-6">
      <StatRow count={3} className="grid grid-cols-1 gap-4 sm:grid-cols-3" />
      <div>
        <Bone className="mb-3 h-5 w-56" />
        {/* Name · Buyer · Sale Date · Sold Price */}
        <TableSkeleton columns={['w-56', 'w-32', 'w-24', 'w-16']} rows={5} />
      </div>
    </Loading>
  );
}

/**
 * One sale per row, shared with SoldItemsPage. Tablet up: buyer/date, items,
 * total, Return. Phones: buyer/date with Return in the top-right corner, then
 * items with the total on the right.
 */
export const saleRowClass =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 px-5 py-3.5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_7rem_auto]';

export function SoldItemsSkeleton() {
  return (
    <Loading label="Loading sales…" className="space-y-4">
      <Bone className="h-6 w-48" />
      <div className={`${cardSurfaceClass} divide-y divide-slate-100 dark:divide-slate-800`}>
        {[1, 2, 1, 1].map((lines, i) => (
          <div key={i} className={saleRowClass}>
            <div className="order-1 space-y-1.5 sm:order-none">
              <Bone className="h-4 w-28" />
              <Bone className="h-3 w-20" />
            </div>
            <div className="order-3 space-y-1.5 sm:order-none">
              {repeat(lines).map((l) => (
                <Bone key={l} className="h-4 w-56 max-w-full" />
              ))}
            </div>
            <Bone className="order-4 h-4 w-16 self-end justify-self-end sm:order-none sm:self-auto" />
            <Bone className="order-2 h-7 w-16 self-start justify-self-end rounded-lg sm:order-none sm:self-auto" />
          </div>
        ))}
      </div>
    </Loading>
  );
}

/** Sell Build: search box, "Selected Components" heading + empty card, Sale Details card. */
export function SellBuildSkeleton() {
  return (
    <Loading label="Loading items for sale…" className="space-y-6">
      <Bone className="h-10 w-full rounded-xl" />
      <div>
        <Bone className="mb-3 h-5 w-48" />
        <div className={cardClass}>
          <Bone className="h-4 w-80 max-w-full" />
        </div>
      </div>
      <div className={cardClass}>
        <Bone className="mb-4 h-5 w-28" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {repeat(3).map((i) => (
            <div key={i} className={i === 2 ? 'sm:col-span-2' : undefined}>
              <Bone className="mb-1.5 h-3.5 w-24" />
              <Bone className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <Bone className="h-11 w-full rounded-xl" />
    </Loading>
  );
}

/** A form input still waiting for its default value (e.g. the next group name). */
export function InputSkeleton() {
  return (
    <Loading label="Loading…">
      <Bone className="h-[42px] w-full rounded-xl" />
    </Loading>
  );
}
