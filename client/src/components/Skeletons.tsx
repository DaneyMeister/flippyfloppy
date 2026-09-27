import type { ReactNode } from 'react';
import { cardClass } from './FormField';

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

export function DashboardSkeleton() {
  return (
    <Loading label="Loading dashboard…" className="space-y-8">
      <StatRow count={4} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" />
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
 */
export function TableSkeleton({ columns, rows = 6 }: { columns: string[]; rows?: number }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {repeat(Math.min(rows, 4)).map((i) => (
          <div key={i} className={`${cardClass} p-4`}>
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
      <div className={`${cardClass} hidden overflow-hidden p-0 md:block`}>
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
      <TableSkeleton columns={['w-48', 'w-16', 'w-28', 'w-20', 'w-16', 'w-20', 'w-20', 'w-5']} rows={8} />
    </Loading>
  );
}

/** Monthly Summary below the month picker: 4 stat cards, heading, sold-items list. */
export function MonthlySummarySkeleton() {
  return (
    <Loading label="Loading monthly summary…" className="space-y-6">
      <StatRow count={4} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" />
      <div>
        <Bone className="mb-3 h-5 w-36" />
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

/** Sold Items: heading and sale cards (buyer + date, total, item lines, Return Sale). */
export function SoldItemsSkeleton() {
  return (
    <Loading label="Loading sales…" className="space-y-4">
      <Bone className="h-6 w-48" />
      <div className="space-y-4">
        {[3, 1, 2].map((lines, i) => (
          <div key={i} className={cardClass}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <Bone className="h-4 w-32" />
                <Bone className="h-3 w-24" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Bone className="h-3 w-10" />
                <Bone className="h-4 w-20" />
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {repeat(lines).map((l) => (
                <div key={l} className="flex items-center justify-between py-2.5">
                  <Bone className="h-4 w-52" />
                  <Bone className="h-4 w-16" />
                </div>
              ))}
            </div>
            <Bone className="mt-3 h-10 w-28 rounded-xl" />
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
