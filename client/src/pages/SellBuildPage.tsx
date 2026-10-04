import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { api, ApiError } from '../api/client';
import type { InventoryItemRow } from '../types';
import { formatPhp, parseMoney, todayDateInput } from '../utils/format';
import { buttonClass, cardClass, inputClass, cardSurfaceClass } from '../components/FormField';
import { SellBuildSkeleton } from '../components/Skeletons';
import { DatePicker } from '../components/DatePicker';

export function SellBuildPage() {
  const { items, loading, groupNameForItem, refresh } = useInventory();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<InventoryItemRow[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [buyerName, setBuyerName] = useState('');
  const [saleDate, setSaleDate] = useState(todayDateInput);
  const [listingUrl, setListingUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) => item.status === 'SELLING' && !selected.some((s) => s.id === item.id))
      .filter((item) =>
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        groupNameForItem(item).toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [items, selected, search, groupNameForItem]);

  function addItem(item: InventoryItemRow) {
    setSelected((prev) => [...prev, item]);
    setPrices((prev) => ({ ...prev, [item.id]: Number(item.listed_price ?? item.assigned_cost).toFixed(2) }));
    setSearch('');
  }

  function removeItem(item: InventoryItemRow) {
    setSelected((prev) => prev.filter((i) => i.id !== item.id));
    setPrices((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  }

  const totalSoldPrice = selected.reduce((sum, item) => sum + parseMoney(prices[item.id] ?? '0'), 0);

  async function handleSave() {
    setError(null);
    setMessage(null);
    if (selected.length === 0) return setError('Select at least one component for this build.');
    if (!buyerName.trim()) return setError('Enter a buyer name.');

    setSaving(true);
    try {
      await api.post('/api/items/sell-build', {
        itemSoldPrices: Object.fromEntries(selected.map((item) => [item.id, parseMoney(prices[item.id] ?? '0')])),
        buyerName: buyerName.trim(),
        saleDate,
        listingUrl: listingUrl.trim() || null,
      });
      await refresh();
      setMessage('Build sold and inventory updated.');
      setSelected([]);
      setPrices({});
      setBuyerName('');
      setListingUrl('');
      setSaleDate(todayDateInput());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sell build');
    } finally {
      setSaving(false);
    }
  }

  if (loading && items.length === 0) return <SellBuildSkeleton />;

  return (
    <div className="animate-fade-in space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-teal-600">{message}</p>}

      <div>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-10`}
            placeholder="Search components (Selling status only)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search.trim() && (
          <div className={`${cardSurfaceClass} mt-2 max-h-72 overflow-y-auto`}>
            {suggestions.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No matching Selling-status items found.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {suggestions.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => addItem(item)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <span>
                        <span className="block font-medium text-slate-900 dark:text-slate-50">{item.name}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {item.category} &middot; {groupNameForItem(item) || 'No Group'}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {formatPhp(item.listed_price ?? item.assigned_cost)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-bold text-slate-900 dark:text-slate-50">Selected Components ({selected.length})</h2>
        {selected.length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm text-slate-500 dark:text-slate-400">No components added yet. Search above to add parts to this build.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selected.map((item) => (
              <div key={item.id} className={`${cardClass} flex items-center gap-4`}>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                </div>
                <label className="block w-40">
                  <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Sold Price</span>
                  <input
                    className={inputClass}
                    value={prices[item.id] ?? ''}
                    onChange={(e) => setPrices((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    inputMode="decimal"
                  />
                </label>
                <button onClick={() => removeItem(item)} className="text-slate-400 hover:text-red-600" aria-label="Remove item">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className={cardClass}>
        <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-50">Sale Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Buyer Name</span>
            <input className={inputClass} value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Sale Date</span>
            <DatePicker value={saleDate} onChange={setSaleDate} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Listing Link (applies to every item in this build)</span>
            <input className={inputClass} value={listingUrl} onChange={(e) => setListingUrl(e.target.value)} />
          </label>
        </div>
      </section>

      <div className={`${cardClass} flex items-center justify-between bg-brand-50 dark:bg-brand-950/40`}>
        <span className="font-semibold text-slate-800 dark:text-slate-100">Total Sold Price</span>
        <span className="text-xl font-black text-slate-900 dark:text-slate-50">{formatPhp(totalSoldPrice)}</span>
      </div>

      <button disabled={saving} onClick={handleSave} className={`w-full ${buttonClass}`}>
        {saving ? 'Saving…' : 'Mark Build as Sold'}
      </button>
    </div>
  );
}
