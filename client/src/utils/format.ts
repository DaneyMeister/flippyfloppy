const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export function formatPhp(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return phpFormatter.format(num);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function parseMoney(value: string): number {
  const normalized = value.replace(/,/g, '').replace(/PHP/gi, '').replace(/₱/g, '').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}
