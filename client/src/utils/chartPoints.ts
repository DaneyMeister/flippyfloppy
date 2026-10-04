import type { DailyTimelinePoint, ProfitTimelinePoint } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** One point on the chart: a short axis label, a longer tooltip label, and its figures. */
export interface ChartPoint {
  label: string;
  longLabel: string;
  revenue: number;
  expenses: number;
  cumulativeNet: number;
}

/** Monthly timeline -> points labelled "Mar '26" (axis) and "Mar 2026" (tooltip). */
export function monthPoints(timeline: ProfitTimelinePoint[]): ChartPoint[] {
  return timeline.map(({ month, ...figures }) => {
    const [year, m] = month.split('-');
    return { ...figures, label: `${MONTHS[Number(m) - 1]} '${year.slice(2)}`, longLabel: `${MONTHS[Number(m) - 1]} ${year}` };
  });
}

/** Daily timeline -> points labelled "Oct 4" (axis) and "Oct 4, 2026" (tooltip). */
export function dayPoints(timeline: DailyTimelinePoint[]): ChartPoint[] {
  return timeline.map(({ date, ...figures }) => {
    const [year, m, d] = date.split('-');
    const label = `${MONTHS[Number(m) - 1]} ${Number(d)}`;
    return { ...figures, label, longLabel: `${label}, ${year}` };
  });
}
