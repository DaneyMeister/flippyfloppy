import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, PiggyBank, PackageCheck } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { MonthlyReport } from '../types';
import { formatDate, formatPhp } from '../utils/format';
import { SummaryCard } from '../components/SummaryCard';
import { cardClass, inputClass } from '../components/FormField';

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthlySummaryPage() {
  const [monthValue, setMonthValue] = useState(currentMonthValue());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const [year, month] = monthValue.split('-').map(Number);
    setLoading(true);
    setError(null);
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
        <input type="month" className={inputClass} value={monthValue} onChange={(e) => setMonthValue(e.target.value)} />
      </label>

      {loading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {report && !loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard title="Total Monthly Expense" value={formatPhp(report.totalExpenses)} subtitle="Acquisition cost + fees" icon={Wallet} />
            <SummaryCard title="Total Monthly Revenue" value={formatPhp(report.totalRevenue)} icon={TrendingUp} />
            <SummaryCard
              title="Net Profit / Loss"
              value={formatPhp(report.netProfit)}
              tone={report.netProfit >= 0 ? 'positive' : 'negative'}
              icon={PiggyBank}
            />
            <SummaryCard title="Items Sold" value={String(report.itemsSold)} subtitle={`Top category: ${report.topCategory}`} icon={PackageCheck} />
          </div>

          <div>
            <h2 className="mb-3 font-bold text-slate-900 dark:text-slate-50">Sold This Month</h2>
            {report.soldItems.length === 0 ? (
              <div className={cardClass}>
                <p className="text-sm text-slate-500 dark:text-slate-400">No sales recorded for this month.</p>
              </div>
            ) : (
              <>
                {/* Mobile: card list */}
                <div className="space-y-3 md:hidden">
                  {report.soldItems.map((item) => (
                    <div key={item.id} className={cardClass}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{item.name}</p>
                        <span className="shrink-0 font-semibold text-slate-900 dark:text-white">{formatPhp(item.sold_price)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Buyer: {item.buyer_name ?? '-'} &middot; Sold {formatDate(item.sale_date)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className={`${cardClass} hidden overflow-x-auto p-0 md:block`}>
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Buyer</th>
                        <th className="px-4 py-3">Sale Date</th>
                        <th className="px-4 py-3 text-right">Sold Price</th>
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
        </>
      )}
    </div>
  );
}
