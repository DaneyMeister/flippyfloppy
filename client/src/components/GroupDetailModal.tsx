import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { X, Pencil } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatDate, formatPhp } from '../utils/format';
import { StatusSelect } from './StatusSelect';
import { EditItemModal } from './EditItemModal';
import { EditGroupModal } from './EditGroupModal';
import { api, ApiError } from '../api/client';
import type { InventoryItemRow, ItemStatus } from '../types';
import { compareByGroupItemStatus } from '../utils/sort';

function SpecBadge({
  label,
  value,
  suffix,
  suffixColor,
  valueColor,
}: {
  label: string;
  value: string;
  suffix?: string;
  suffixColor?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-100/80 p-3.5 dark:bg-slate-800/60">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
        {suffix && <span className={`ml-1 font-semibold ${suffixColor}`}>{suffix}</span>}
      </p>
      <p className={`mt-1 font-display text-base font-bold ${valueColor ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

export function GroupDetailModal({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const { groupById, itemsForGroup, refresh } = useInventory();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItemRow | null>(null);
  const [editingGroup, setEditingGroup] = useState(false);

  const group = groupById(groupId);
  const items = useMemo(() => [...itemsForGroup(groupId)].sort(compareByGroupItemStatus), [itemsForGroup, groupId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const stats = useMemo(() => {
    if (!group) return null;
    const additionalExpenses = (group.group_expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
    const baseCost = Number(group.base_cost);
    const totalCost = baseCost + additionalExpenses;
    const revenue = items.reduce((sum, item) => sum + Number(item.sold_price ?? 0), 0);
    const totalValue = items.reduce((sum, item) => sum + Number(item.assigned_cost), 0);
    const netProfit = revenue - totalCost;
    const margin = totalCost === 0 ? 0 : Math.round((netProfit / totalCost) * 100);
    return { additionalExpenses, baseCost, totalCost, revenue, totalValue, netProfit, margin };
  }, [group, items]);

  // Item rows are divs (not real buttons, since they contain a nested
  // StatusSelect a <button> can't legally wrap) -- this keeps them reachable
  // and operable by keyboard the same way a click would be.
  function handleRowKeyDown(e: ReactKeyboardEvent, item: InventoryItemRow) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setEditingItem(item);
    }
  }

  async function changeStatus(itemId: string, status: ItemStatus) {
    setBusyId(itemId);
    setError(null);
    try {
      await api.patch(`/api/items/${itemId}`, { status });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update item');
    } finally {
      setBusyId(null);
    }
  }

  if (!group || !stats) return null;
  const positive = stats.netProfit >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-extrabold text-slate-900 dark:text-white">{group.group_name}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {group.group_type} &middot; Purchased {formatDate(group.purchase_date)}
              {group.bought_from && <> &middot; From {group.bought_from}</>}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setEditingGroup(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Edit group"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SpecBadge label="Base Cost" value={formatPhp(stats.baseCost)} />
            <SpecBadge label="Additional Expenses" value={formatPhp(stats.additionalExpenses)} />
            <SpecBadge label="Total Cost" value={formatPhp(stats.totalCost)} />
            <SpecBadge label="Total Value" value={formatPhp(stats.totalValue)} />
            <SpecBadge label="Revenue" value={formatPhp(stats.revenue)} />
            <SpecBadge
              label="Net Profit"
              suffix={`(${stats.margin}%)`}
              suffixColor={positive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
              valueColor={positive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
              value={formatPhp(stats.netProfit)}
            />
          </div>

          {(group.group_expenses ?? []).length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-display text-sm font-bold text-slate-900 dark:text-white">Expense Breakdown</h3>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {(group.group_expenses ?? []).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{expense.category}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatPhp(expense.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="mb-2 font-display text-sm font-bold text-slate-900 dark:text-white">
              Items ({items.length})
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingItem(item)}
                  onKeyDown={(e) => handleRowKeyDown(e, item)}
                  className={`cursor-pointer rounded-xl border border-slate-100 p-3.5 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${busyId === item.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <StatusSelect status={item.status} disabled={busyId === item.id} onChange={(status) => changeStatus(item.id, status)} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-4">
                    <p>Cost: <span className="font-medium text-slate-900 dark:text-white">{formatPhp(item.assigned_cost)}</span></p>
                    <p>Sold: <span className="font-medium text-slate-900 dark:text-white">{item.sold_price == null ? '—' : formatPhp(item.sold_price)}</span></p>
                    <p>Buyer: <span className="font-medium text-slate-900 dark:text-white">{item.buyer_name ?? '—'}</span></p>
                    <p>Sale Date: <span className="font-medium text-slate-900 dark:text-white">{formatDate(item.sale_date)}</span></p>
                  </div>
                  {item.notes && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Notes: {item.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editingItem && <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} />}
      {editingGroup && <EditGroupModal groupId={groupId} onClose={() => setEditingGroup(false)} />}
    </div>
  );
}
