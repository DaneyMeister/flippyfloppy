import { useEffect, useId, useState, type PointerEvent } from 'react';
import type { ChartPoint } from '../utils/chartPoints';
import { formatPhp } from '../utils/format';

const PAD = { top: 12, right: 12, bottom: 24, left: 52 };

const compactPhp = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Round axis ticks covering [min, max] in about four steps. */
function niceTicks(min: number, max: number): number[] {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let t = Math.floor(min / step) * step; t <= Math.ceil(max / step) * step + step / 2; t += step) ticks.push(t);
  return ticks;
}

/**
 * Smooth SVG path through the points (monotone cubic, Fritsch-Carlson). The
 * curve never overshoots between two points, so it can't show a peak, dip
 * or break-even crossing that isn't in the data.
 */
function smoothPath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n < 3) return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) slopes.push((points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x));

  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    const [a, b] = [slopes[i - 1], slopes[i]];
    // Flat at local peaks and dips; otherwise a weighted harmonic mean.
    if (a * b <= 0) return 0;
    const [lo, hi] = [Math.min(Math.abs(a), Math.abs(b)), Math.max(Math.abs(a), Math.abs(b))];
    return (Math.sign(a) * 3 * lo * hi) / (2 * hi + lo);
  });

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 3;
    d += ` C${p0.x + dx},${p0.y + tangents[i] * dx} ${p1.x - dx},${p1.y - tangents[i + 1] * dx} ${p1.x},${p1.y}`;
  }
  return d;
}

/** Width and height of an element, kept up to date as it resizes. */
function useSize<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  return [setEl, size] as const;
}

/**
 * Line chart of running net profit (month by month on the Dashboard, day by
 * day on Monthly Summary). Hover (or touch) shows that point's running total
 * with its revenue and expenses; a hidden table gives screen readers the same
 * numbers. `emptyMessage` shows instead when there's nothing to draw.
 */
export function ProfitChart({ data, title, emptyMessage }: { data: ChartPoint[]; title: string; emptyMessage: string }) {
  const [containerRef, { width, height }] = useSize<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();

  if (data.length < 2 || data.every((d) => d.revenue === 0 && d.expenses === 0)) {
    return (
      <div className="flex h-full min-h-[200px] flex-col">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className="mt-2 flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-sm text-slate-400 dark:border-slate-800">
          {emptyMessage}
        </div>
      </div>
    );
  }

  const values = data.map((d) => d.cumulativeNet);
  const ticks = niceTicks(Math.min(0, ...values), Math.max(0, ...values));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = Math.max(0, height - PAD.top - PAD.bottom);
  const x = (i: number) => PAD.left + (i / (data.length - 1)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin || 1)) * plotH;

  const linePath = smoothPath(data.map((d, i) => ({ x: x(i), y: y(d.cumulativeNet) })));
  const areaPath = `${linePath} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const last = data.length - 1;
  const xLabels = data.length >= 5 ? [0, Math.round(last / 2), last] : [0, last];

  const handlePointer = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left - PAD.left) / (plotW || 1);
    setActive(Math.min(last, Math.max(0, Math.round(ratio * last))));
  };

  const point = active === null ? null : data[active];
  const tooltipLeft = active === null ? 0 : Math.min(Math.max(x(active), 80), width - 80);

  return (
    <div className="flex h-full min-h-[200px] flex-col">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div
        ref={containerRef}
        className="relative mt-2 min-h-[180px] flex-1 [--chart-line:var(--color-brand-500)] dark:[--chart-line:var(--color-brand-400)]"
      >
        {width > 0 && height > 0 && (
          <svg
            width={width}
            height={height}
            className="absolute inset-0 touch-none select-none"
            aria-hidden="true"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setActive(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--chart-line)', stopOpacity: 0.18 }} />
                <stop offset="100%" style={{ stopColor: 'var(--chart-line)', stopOpacity: 0 }} />
              </linearGradient>
            </defs>

            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  className={t === 0 ? 'stroke-slate-300 dark:stroke-slate-600' : 'stroke-slate-100 dark:stroke-slate-800'}
                  strokeDasharray={t === 0 ? '4 4' : undefined}
                />
                <text
                  x={PAD.left - 8}
                  y={y(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-slate-400 text-[11px] tabular-nums dark:fill-slate-500"
                >
                  {compactPhp.format(t)}
                </text>
              </g>
            ))}

            {xLabels.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={height - 6}
                textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}
                className="fill-slate-400 text-[11px] dark:fill-slate-500"
              >
                {data[i].label}
              </text>
            ))}

            <path d={areaPath} fill={`url(#${gradientId})`} className="animate-fade-in [animation-delay:0.35s] [animation-duration:0.7s] [animation-fill-mode:backwards]" />
            {/* pathLength={1} lets the draw-line animation work for any line length. */}
            <path
              d={linePath}
              pathLength={1}
              className="animate-draw-line"
              fill="none"
              style={{ stroke: 'var(--chart-line)' }}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {point && active !== null && (
              <line
                x1={x(active)}
                x2={x(active)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                className="stroke-slate-300 dark:stroke-slate-600"
              />
            )}
            {(active === null ? [last] : [active]).map((i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(data[i].cumulativeNet)}
                r={4.5}
                strokeWidth={2}
                style={{ fill: 'var(--chart-line)' }}
                className="stroke-white dark:stroke-slate-900"
              />
            ))}
          </svg>
        )}

        {point && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-40 -translate-x-1/2 animate-fade-in rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={{ left: tooltipLeft }}
          >
            <p className="font-semibold text-slate-900 dark:text-white">{point.longLabel}</p>
            <div className="mt-1 flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Net to date</span>
              <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatPhp(point.cumulativeNet)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Revenue</span>
              <span className="tabular-nums text-slate-700 dark:text-slate-200">{formatPhp(point.revenue)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Expenses</span>
              <span className="tabular-nums text-slate-700 dark:text-slate-200">{formatPhp(point.expenses)}</span>
            </div>
          </div>
        )}
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Revenue</th>
            <th scope="col">Expenses</th>
            <th scope="col">Net to date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.longLabel}>
              <th scope="row">{d.longLabel}</th>
              <td>{formatPhp(d.revenue)}</td>
              <td>{formatPhp(d.expenses)}</td>
              <td>{formatPhp(d.cumulativeNet)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
