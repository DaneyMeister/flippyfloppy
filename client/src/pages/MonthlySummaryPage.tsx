import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { MonthlyReport } from '../types';
import { formatDate, formatPhp } from '../utils/format';
import { StatTile, StatsLayout } from '../components/StatCards';
import { ProfitChart } from '../components/ProfitChart';
import { dayPoints } from '../utils/chartPoints';
import { cardClass, cardSurfaceClass } from '../components/FormField';
import { MonthlySummarySkeleton } from '../components/Skeletons';
import { MonthPicker } from '../components/DatePicker';

/** "+16.3% return on spending", or why there's no percentage. */
function returnLine(report: MonthlyReport) {
  if (report.totalExpenses === 0) return report.totalRevenue === 0 ? 'No purchases or sales' : 'No purchases this month';
  const margin = (report.netProfit / report.totalExpenses) * 100;
  return `${report.netProfit >= 0 ? '+' : ''}${margin.toFixed(1)}% return on spending`;
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthlySummaryPage() {
  const [monthValue, setMonthValue] = useState(currentMonthValue());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset loading/error when the month is picked, not inside the effect.
  function changeMonth(value: string) {
    if (value === monthValue) return;
    setMonthValue(value);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    const [year, month] = monthValue.split('-').map(Number);
    api
      .get<MonthlyReport>(`/api/analytics/monthly?year=${year}&month=${month}`)
      .then(setReport)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load monthly report'))
      .finally(() => setLoading(false));
  }, [monthValue]);

  return (
    <div className="space-y-6">
      <label className="block max-w-xs">
        <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Month</span>
        <MonthPicker value={monthValue} onChange={changeMonth} />
      </label>

      {loading && <MonthlySummarySkeleton />}
      {error && <p className="text-red-600">{error}</p>}

      {report && !loading && (
        <div className="animate-fade-in space-y-6">
          <StatsLayout
            netProfit={report.netProfit}
            subline={returnLine(report)}
            breakdown={[
              {
                label: 'Cost recovered',
                value: report.totalExpenses === 0 ? '-' : `${Math.round((report.totalRevenue / report.totalExpenses) * 100)}%`,
              },
              { label: 'Average sale', value: report.itemsSold === 0 ? '-' : formatPhp(report.totalRevenue / report.itemsSold) },
            ]}
            chart={
              <ProfitChart
                data={dayPoints(report.dailyTimeline)}
                title="Net profit, day by day"
                emptyMessage="No purchases or sales this month yet."
              />
            }
            tiles={
              <>
                <StatTile title="Total Monthly Expense" value={formatPhp(report.totalExpenses)} pill="Purchases + fees" />
                <StatTile title="Total Monthly Revenue" value={formatPhp(report.totalRevenue)} pill="Sales" />
                <StatTile
                  title="Items Sold"
                  value={String(report.itemsSold)}
                  pill={report.itemsSold === 0 ? 'No sales' : `Top: ${report.topCategory}`}
                />
              </>
            }
          />

          <div>
            <h2 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-white">Sold This Month</h2>
            {report.soldItems.length === 0 ? (
              <div className={cardClass}>
                <p className="text-sm text-slate-500 dark:text-slate-400">No sales recorded for this month.</p>
              </div>
            ) : (
              <>
                {/* Mobile: card list */}
                <div className="space-y-3 md:hidden">
                  {report.soldItems.map((item) => (
                    <div key={item.id} className={`${cardSurfaceClass} p-4`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate font-semibold text-slate-900 dark:text-white">{item.name}</p>
                        <span className="shrink-0 font-display text-xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                          {formatPhp(item.sold_price)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
                        <span className="truncate">Buyer: {item.buyer_name ?? '-'}</span>
                        <span className="shrink-0">Sold {formatDate(item.sale_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className={`${cardSurfaceClass} hidden overflow-x-auto md:block`}>
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Category</th>
                        <th className="px-4 py-3 font-semibold">Buyer</th>
                        <th className="px-4 py-3 font-semibold">Sale Date</th>
                        <th className="px-4 py-3 text-right font-semibold">Sold Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {report.soldItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">{item.name}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.category}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{item.buyer_name ?? '-'}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(item.sale_date)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-50">{formatPhp(item.sold_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
