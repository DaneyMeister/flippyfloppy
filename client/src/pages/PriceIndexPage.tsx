import { useState, type FormEvent } from 'react';
import { Search, Wallet, Tag, Trophy } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { PriceLookupResult } from '../types';
import { formatDate, formatPhp } from '../utils/format';
import { buttonClass, cardClass, inputClass } from '../components/FormField';
import { SummaryCard } from '../components/SummaryCard';
import { PriceIndexSkeleton } from '../components/Skeletons';

export function PriceIndexPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PriceLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PriceLookupResult>(`/api/analytics/price-lookup?q=${encodeURIComponent(query.trim())}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex max-w-lg flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-10`}
            placeholder="Search by name, category, or notes (e.g. RTX 3060)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      {loading && <PriceIndexSkeleton />}

      {result && !loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard title="Average Acquired Cost" value={formatPhp(result.averageAcquiredCost)} subtitle={`${result.matches.length} match(es)`} icon={Wallet} />
            <SummaryCard title="Average Sold Price" value={formatPhp(result.averageSoldPrice)} icon={Tag} />
            <SummaryCard title="Highest Sold Price" value={formatPhp(result.highestSoldPrice)} icon={Trophy} />
          </div>

          <div>
            <h2 className="mb-3 font-bold text-slate-900 dark:text-slate-50">Sale History for &ldquo;{result.keyword}&rdquo;</h2>
            {result.history.length === 0 ? (
              <div className={cardClass}>
                <p className="text-sm text-slate-500 dark:text-slate-400">No sold items match this keyword yet.</p>
              </div>
            ) : (
              <>
                {/* Mobile: card list (same pattern as Monthly Summary) */}
                <div className="space-y-3 md:hidden">
                  {result.history.map((entry, index) => (
                    <div key={index} className={cardClass}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">{entry.name}</p>
                        <span className="shrink-0 font-semibold text-slate-900 dark:text-white">{formatPhp(entry.soldPrice)}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Buyer: {entry.buyerName ?? '-'} &middot; Sold {formatDate(entry.saleDate)}
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
                        <th className="px-4 py-3">Buyer</th>
                        <th className="px-4 py-3">Sale Date</th>
                        <th className="px-4 py-3 text-right">Sold Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {result.history.map((entry, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">{entry.name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{entry.buyerName ?? '-'}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(entry.saleDate)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-50">{formatPhp(entry.soldPrice)}</td>
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
