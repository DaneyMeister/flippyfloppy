import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api/client';
import { GROUP_TYPES, type DashboardSummary } from '../types';
import { DashboardStats } from '../components/DashboardStats';
import { GroupDetailModal } from '../components/GroupDetailModal';
import { formatPhp, formatDate } from '../utils/format';
import { cardClass, inputClass } from '../components/FormField';
import { groupBucketPriority } from '../utils/sort';
import { DashboardSkeleton } from '../components/Skeletons';

const ALL_CATEGORY = 'All Category';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  const loadSummary = useCallback(() => {
    return api.get<DashboardSummary>('/api/analytics/dashboard').then(setSummary);
  }, []);

  useEffect(() => {
    loadSummary()
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [loadSummary]);

  const summaries = useMemo(() => {
    if (!summary) return [];
    const sorted = [...summary.groupSummaries].sort((a, b) => {
      const priorityCompare = groupBucketPriority(a.group.groupName, a.group.groupType) - groupBucketPriority(b.group.groupName, b.group.groupType);
      if (priorityCompare !== 0) return priorityCompare;
      return new Date(b.group.purchaseDate).getTime() - new Date(a.group.purchaseDate).getTime();
    });
    return selectedCategory === ALL_CATEGORY ? sorted : sorted.filter((s) => s.group.groupType === selectedCategory);
  }, [summary, selectedCategory]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!summary) return null;

  return (
    <div className="animate-fade-in space-y-8">
      <DashboardStats summary={summary} />

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Group Summary</h2>
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap text-sm text-slate-400">{summaries.length} groups</span>
            <select
              className={`${inputClass} w-auto py-1.5 text-sm`}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value={ALL_CATEGORY}>{ALL_CATEGORY}</option>
              {GROUP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        {summaries.length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedCategory === ALL_CATEGORY ? 'No purchase groups yet.' : `No ${selectedCategory} groups yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summaries.map((s) => {
              const margin = s.totalCost === 0 ? 0 : Math.round((s.netProfit / s.totalCost) * 100);
              const positive = s.netProfit >= 0;
              const soldRatio = s.totalCost === 0 ? 0 : Math.min(1, Math.max(0, s.revenue / s.totalCost));
              return (
                <button
                  key={s.group.id}
                  onClick={() => setSelectedGroupId(s.group.id)}
                  className={`${cardClass} flex w-full cursor-pointer flex-col text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate font-display font-bold text-slate-900 dark:text-white">{s.group.groupName}</h3>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {s.group.groupType}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {s.itemCount} item{s.itemCount === 1 ? '' : 's'} ({formatPhp(s.totalAssignedCost)}) &middot; {formatDate(s.group.purchaseDate)}
                  </p>

                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${positive ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.round(soldRatio * 100)}%` }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Cost</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{formatPhp(s.totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Revenue</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{formatPhp(s.revenue)}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${positive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        Net ({margin}%)
                      </p>
                      <p className={`font-semibold ${positive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatPhp(s.netProfit)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedGroupId && (
        <GroupDetailModal
          groupId={selectedGroupId}
          onClose={() => {
            setSelectedGroupId(null);
            loadSummary().catch(() => undefined);
          }}
        />
      )}
    </div>
  );
}
