import type { DashboardSummary } from '../types';
import { formatPhp } from '../utils/format';
import { monthPoints } from '../utils/chartPoints';
import { ProfitChart } from './ProfitChart';
import { StatTile, StatsLayout } from './StatCards';

/**
 * Dashboard headline: Net Profit / Loss as the large primary card, with
 * Expenses, Revenue and Liquid Assets stacked beside it.
 */
export function DashboardStats({ summary }: { summary: DashboardSummary }) {
  // Return on cost, the same way each group card works out its margin.
  const margin = summary.totalExpenses === 0 ? 0 : (summary.netProfit / summary.totalExpenses) * 100;
  const recovered = summary.totalExpenses === 0 ? 0 : Math.round((summary.totalRevenue / summary.totalExpenses) * 100);
  const profitableGroups = summary.groupSummaries.filter((s) => s.netProfit > 0).length;

  return (
    <StatsLayout
      netProfit={summary.netProfit}
      subline={`${summary.netProfit >= 0 ? '+' : ''}${margin.toFixed(1)}% return on cost`}
      breakdown={[
        { label: 'Cost recovered', value: `${recovered}%` },
        {
          label: 'Profitable groups',
          value: (
            <>
              {profitableGroups}
              <span className="text-[11px] font-semibold text-slate-400 md:text-base"> of {summary.groupSummaries.length}</span>
            </>
          ),
        },
      ]}
      chart={
        <ProfitChart
          data={monthPoints(summary.profitTimeline)}
          title="Net profit over time"
          emptyMessage="The chart appears once there are two months of history."
        />
      }
      tiles={
        <>
          <StatTile title="Total Expenses" value={formatPhp(summary.totalExpenses)} pill="Base + fees" />
          <StatTile title="Total Revenue" value={formatPhp(summary.totalRevenue)} pill="Sold only" />
          <StatTile
            title="Total Liquid Assets"
            value={formatPhp(summary.totalLiquidAssets)}
            pill={`${summary.sellingItemCount} for sale`}
          />
        </>
      }
    />
  );
}
