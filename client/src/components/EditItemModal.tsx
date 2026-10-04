import { useEffect, useMemo, useState } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { api, ApiError } from '../api/client';
import { BOUGHT_COMPONENTS_GROUP_NAME, INVENTORY_CATEGORIES, ITEM_STATUSES, type InventoryItemRow, type ItemStatus } from '../types';
import { formatPhp, parseMoney, toDateInput, todayDateInput } from '../utils/format';
import { buttonClass, inputClass } from './FormField';
import { DatePicker } from './DatePicker';

export function EditItemModal({ item, onClose }: { item: InventoryItemRow; onClose: () => void }) {
  const { groups, groupById, refresh } = useInventory();

  const [name, setName] = useState(item.name);
  const [listingUrl, setListingUrl] = useState(item.listing_url ?? '');
  const [groupId, setGroupId] = useState(item.group_id ?? '');
  const [category, setCategory] = useState(item.category);
  const [status, setStatus] = useState<ItemStatus>(item.status);
  const [assignedCost, setAssignedCost] = useState(String(item.assigned_cost));
  const [notes, setNotes] = useState(item.notes ?? '');
  const [purchaseDate, setPurchaseDate] = useState(toDateInput(item.purchase_date));
  const [boughtFrom, setBoughtFrom] = useState(item.bought_from ?? '');
  const [soldPrice, setSoldPrice] = useState(String(item.sold_price ?? item.assigned_cost));
  const [buyerName, setBuyerName] = useState(item.buyer_name ?? '');
  const [saleDate, setSaleDate] = useState(toDateInput(item.sale_date) || todayDateInput());

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const isBoughtComponentsItem = groupById(groupId || null)?.group_name === BOUGHT_COMPONENTS_GROUP_NAME;

  const linkedExpenses = useMemo(
    () => groups.flatMap((g) => (g.group_expenses ?? []).filter((e) => e.item_id === item.id)),
    [groups, item.id]
  );

  async function deleteExpense(expenseId: string) {
    setDeletingExpenseId(expenseId);
    try {
      await api.delete(`/api/expenses/${expenseId}`);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete expense');
    } finally {
      setDeletingExpenseId(null);
    }
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError('Enter a component name.');

    setSaving(true);
    try {
      await api.patch(`/api/items/${item.id}`, {
        name: name.trim(),
        group_id: groupId || null,
        category,
        status,
        assigned_cost: parseMoney(assignedCost),
        sold_price: status === 'SOLD' ? parseMoney(soldPrice) : null,
        buyer_name: status === 'SOLD' ? buyerName.trim() || null : null,
        sale_date: status === 'SOLD' ? saleDate : null,
        listing_url: listingUrl.trim() || null,
        notes: notes.trim() || null,
        purchase_date: purchaseDate || null,
        bought_from: boughtFrom.trim() || null,
      });
      await refresh();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save item');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full animate-sheet-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:animate-modal-in dark:bg-slate-900 sm:max-w-xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <h2 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">Edit Inventory Item</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Basic Info</h3>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Component Name</span>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Listing Link</span>
              <input className={inputClass} value={listingUrl} onChange={(e) => setListingUrl(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Group</span>
              <select className={inputClass} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                <option value="">No Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.group_name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</span>
                <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {INVENTORY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</span>
                <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)}>
                  {ITEM_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Cost &amp; Notes</h3>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Assigned Cost (₱)</span>
              <input className={inputClass} value={assignedCost} onChange={(e) => setAssignedCost(e.target.value)} inputMode="decimal" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</span>
              <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            {isBoughtComponentsItem && (
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Purchase Date</span>
                  <DatePicker value={purchaseDate} onChange={setPurchaseDate} clearable />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bought From</span>
                  <input className={inputClass} value={boughtFrom} onChange={(e) => setBoughtFrom(e.target.value)} />
                </label>
              </div>
            )}
          </div>

          {linkedExpenses.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-display text-sm font-bold text-slate-900 dark:text-white">Linked Expenses</h3>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {linkedExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{expense.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900 dark:text-white">{formatPhp(expense.amount)}</span>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        disabled={deletingExpenseId === expense.id}
                        className="text-red-500 hover:text-red-600 disabled:opacity-50"
                        aria-label="Delete expense"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'SOLD' && (
            <div className="mt-6 space-y-4">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Sale Details</h3>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Sold Price (₱)</span>
                <input className={inputClass} value={soldPrice} onChange={(e) => setSoldPrice(e.target.value)} inputMode="decimal" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Buyer Name</span>
                <input className={inputClass} value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Sale Date</span>
                <DatePicker value={saleDate} onChange={setSaleDate} />
              </label>
            </div>
          )}

          <button onClick={handleSave} disabled={saving} className={`mt-7 w-full ${buttonClass}`}>
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
