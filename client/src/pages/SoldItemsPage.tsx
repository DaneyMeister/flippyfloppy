import { useMemo, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { api, ApiError } from '../api/client';
import { formatDate, formatPhp } from '../utils/format';
import { cardClass, secondaryButtonClass } from '../components/FormField';
import type { InventoryItemRow } from '../types';
import { SoldItemsSkeleton } from '../components/Skeletons';

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
    if (!confirm(`Return this sale (${group.items.length} item${group.items.length === 1 ? '' : 's'}) back to available inventory?`)) return;
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Sales Record History</h2>
      {saleGroups.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">No sales recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {saleGroups.map((group) => {
            const total = group.items.reduce((sum, item) => sum + Number(item.sold_price ?? 0), 0);
            return (
              <div key={group.key} className={cardClass}>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-50">{group.buyerName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sold {formatDate(group.saleDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                    <p className="font-bold text-slate-900 dark:text-slate-50">{formatPhp(total)}</p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-700 dark:text-slate-200">{item.name} <span className="text-slate-400">({item.category})</span></span>
                      <span className="font-medium text-slate-900 dark:text-slate-50">{formatPhp(item.sold_price)}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={busyKey === group.key}
                  onClick={() => returnSale(group)}
                  className={`mt-3 ${secondaryButtonClass}`}
                >
                  {busyKey === group.key ? 'Reverting…' : 'Return Sale'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
