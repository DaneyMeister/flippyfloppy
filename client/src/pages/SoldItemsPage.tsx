import { useMemo, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { api, ApiError } from '../api/client';
import { formatDate, formatPhp } from '../utils/format';
import { cardClass, cardSurfaceClass } from '../components/FormField';
import type { InventoryItemRow } from '../types';
import { SoldItemsSkeleton, saleRowClass } from '../components/Skeletons';
import { useConfirm } from '../components/useConfirm';

interface SaleGroup {
  key: string;
  buyerName: string;
  saleDate: string | null;
  items: InventoryItemRow[];
}

export function SoldItemsPage() {
  const { items, loading, refresh } = useInventory();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const saleGroups = useMemo<SaleGroup[]>(() => {
    const soldItems = items.filter((item) => item.status === 'SOLD');
    const grouped = new Map<string, InventoryItemRow[]>();
    for (const item of soldItems) {
      const key = `${item.buyer_name ?? ''}|${item.sale_date ?? ''}`;
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    return [...grouped.entries()]
      .map(([key, groupItems]) => ({
        key,
        buyerName: groupItems[0].buyer_name?.trim() || 'Unknown Buyer',
        saleDate: groupItems[0].sale_date,
        items: groupItems,
      }))
      .sort((a, b) => new Date(b.saleDate ?? 0).getTime() - new Date(a.saleDate ?? 0).getTime());
  }, [items]);

  async function returnSale(group: SaleGroup) {
    const count = group.items.length;
    const ok = await confirm({
      title: 'Return this sale?',
      message: (
        <>
          {count === 1 ? (
            <span className="font-semibold text-slate-700 dark:text-slate-200">{group.items[0].name}</span>
          ) : (
            <>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{count} items</span> sold to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{group.buyerName}</span>
            </>
          )}{' '}
          will go back to available inventory, and the sale will be removed from this history.
        </>
      ),
      confirmLabel: 'Return Sale',
      cancelLabel: 'Keep the Sale',
    });
    if (!ok) return;
    setBusyKey(group.key);
    setError(null);
    try {
      await api.post('/api/items/return-sale', { itemIds: group.items.map((i) => i.id) });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to return sale');
    } finally {
      setBusyKey(null);
    }
  }

  if (loading && items.length === 0) return <SoldItemsSkeleton />;
  if (error) return <p className="text-red-600">{error}</p>;

  const grandTotal = saleGroups.reduce(
    (sum, group) => sum + group.items.reduce((s, item) => s + Number(item.sold_price ?? 0), 0),
    0,
  );

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Sales Record History</h2>
        {saleGroups.length > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {saleGroups.length} sale{saleGroups.length === 1 ? '' : 's'} ·{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-50">{formatPhp(grandTotal)}</span>
          </p>
        )}
      </div>
      {saleGroups.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">No sales recorded yet.</p>
        </div>
      ) : (
        <ul className={`${cardSurfaceClass} divide-y divide-slate-100 overflow-hidden dark:divide-slate-800`}>
          {saleGroups.map((group) => {
            const total = group.items.reduce((sum, item) => sum + Number(item.sold_price ?? 0), 0);
            const multi = group.items.length > 1;
            return (
              <li key={group.key} className={saleRowClass}>
                <div className="order-1 min-w-0 sm:order-none">
                  <p className="truncate font-semibold text-slate-900 dark:text-slate-50">{group.buyerName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(group.saleDate)}</p>
                </div>
                <ul className="order-3 min-w-0 space-y-0.5 text-sm sm:order-none">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">
                        {item.name} <span className="text-slate-400">· {item.category}</span>
                      </span>
                      {multi && (
                        <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{formatPhp(item.sold_price)}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="order-4 self-end text-right font-bold tabular-nums sm:order-none sm:self-auto text-slate-900 dark:text-slate-50">{formatPhp(total)}</p>
                <button
                  disabled={busyKey === group.key}
                  onClick={() => returnSale(group)}
                  aria-label={`Return sale to ${group.buyerName}`}
                  className={`order-2 self-start justify-self-end sm:order-none sm:self-auto ${compactButtonClass}`}
                >
                  {busyKey === group.key ? 'Reverting…' : 'Return'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {confirmDialog}
    </div>
  );
}

const compactButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800';
