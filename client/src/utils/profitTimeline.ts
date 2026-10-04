import type { DailyTimelinePoint, ProfitTimelinePoint } from '../types';

/**
 * Month-by-month running net profit, from the first purchase or sale up to
 * the current month, with no gaps. Expenses land in their group's purchase
 * month and revenue in its sale month, both by UTC month like the Monthly
 * Summary report, so the last point equals the dashboard's netProfit.
 * Same as buildProfitTimeline in the server's analyticsService; used by the
 * demo API.
 */
export function buildProfitTimeline(
  expenses: { month: string; amount: number }[],
  revenue: { month: string; amount: number }[],
  now = new Date()
): ProfitTimelinePoint[] {
  const byMonth = new Map<string, { expenses: number; revenue: number }>();
  const bucket = (month: string) => {
    let entry = byMonth.get(month);
    if (!entry) byMonth.set(month, (entry = { expenses: 0, revenue: 0 }));
    return entry;
  };
  for (const e of expenses) bucket(e.month).expenses += e.amount;
  for (const r of revenue) bucket(r.month).revenue += r.amount;
  if (byMonth.size === 0) return [];

  const months = [...byMonth.keys()].sort();
  const currentMonth = now.toISOString().slice(0, 7);
  const lastMonth = months[months.length - 1] > currentMonth ? months[months.length - 1] : currentMonth;

  const timeline: ProfitTimelinePoint[] = [];
  let [year, month] = months[0].split('-').map(Number);
  let cumulativeNet = 0;
  for (;;) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const entry = byMonth.get(key) ?? { expenses: 0, revenue: 0 };
    cumulativeNet += entry.revenue - entry.expenses;
    timeline.push({ month: key, expenses: entry.expenses, revenue: entry.revenue, cumulativeNet });
    if (key >= lastMonth) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return timeline;
}

/**
 * Day-by-day running net profit within one month (UTC days, like the rest of
 * the monthly report). Runs to the month's last day, or to today for the
 * current month; empty for a month that hasn't started.
 * Same as buildDailyTimeline in the server's analyticsService; used by the
 * demo API.
 */
export function buildDailyTimeline(
  year: number,
  month: number,
  expenses: { date: string; amount: number }[],
  revenue: { date: string; amount: number }[],
  now = new Date()
): DailyTimelinePoint[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const today = now.toISOString().slice(0, 10);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const sumByDay = (rows: { date: string; amount: number }[]) => {
    const totals = new Map<string, number>();
    for (const r of rows) totals.set(r.date, (totals.get(r.date) ?? 0) + r.amount);
    return totals;
  };
  const expensesByDay = sumByDay(expenses);
  const revenueByDay = sumByDay(revenue);

  const timeline: DailyTimelinePoint[] = [];
  let cumulativeNet = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${prefix}-${String(day).padStart(2, '0')}`;
    if (date > today) break;
    const dayExpenses = expensesByDay.get(date) ?? 0;
    const dayRevenue = revenueByDay.get(date) ?? 0;
    cumulativeNet += dayRevenue - dayExpenses;
    timeline.push({ date, expenses: dayExpenses, revenue: dayRevenue, cumulativeNet });
  }
  return timeline;
}
