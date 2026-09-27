const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export function formatPhp(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return phpFormatter.format(num);
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Plain dates ("2026-09-12") are calendar days, not moments: read them as
 * local midnight. `new Date("2026-09-12")` would mean UTC midnight instead,
 * which lands on the previous day west of UTC.
 */
function parseDateValue(value: string): Date {
  const m = DATE_ONLY_RE.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function localDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Value for an <input type="date"> from a stored date or timestamp, as the
 * local calendar day. Slicing the text instead would take the UTC day, so a
 * sale at 7am in the Philippines (23:00 UTC the day before) showed, and was
 * re-saved as, the previous day.
 */
export function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  if (DATE_ONLY_RE.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : localDateInput(date);
}

/** Today as YYYY-MM-DD in local time (toISOString() would give the UTC day). */
export function todayDateInput(): string {
  return localDateInput(new Date());
}

export function parseMoney(value: string): number {
  const normalized = value.replace(/,/g, '').replace(/PHP/gi, '').replace(/₱/g, '').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}
