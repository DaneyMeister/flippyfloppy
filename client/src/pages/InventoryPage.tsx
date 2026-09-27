import { useMemo, useState, type KeyboardEvent } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StatusSelect } from '../components/StatusSelect';
import { EditItemModal } from '../components/EditItemModal';
import { formatPhp, formatDate } from '../utils/format';
import { api, ApiError } from '../api/client';
import { ITEM_STATUSES, type InventoryItemRow, type ItemStatus } from '../types';
import { cardClass, dangerTextButtonClass, inputClass } from '../components/FormField';
import { compareByName, compareByPriority, compareBySaleDateDesc } from '../utils/sort';
import { InventorySkeleton } from '../components/Skeletons';

export function InventoryPage() {
  const { items, groups, loading, error, refresh, groupById, groupNameForItem } = useInventory();
  const [statusFilter, setStatusFilter] = useState<'ALL' | ItemStatus>('ALL');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItemRow | null>(null);

  // "All statuses" defaults to active (non-sold) inventory -- sold items get
  // their own history in Sold Items -- but selecting SOLD explicitly here
  // still surfaces them.
  const baseItems = useMemo(
    () => (statusFilter === 'ALL' ? items.filter((i) => i.status !== 'SOLD') : items),
    [items, statusFilter]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = baseItems.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        groupNameForItem(item).toLowerCase().includes(query)
      );
    });

    // Mirrors the original app's default ordering: active inventory sorts by
    // status priority then category then name; a single specific status just
    // sorts by name; Sold sorts most-recent-sale first.
    const sorted = [...matches];
    if (statusFilter === 'ALL') sorted.sort(compareByPriority);
    else if (statusFilter === 'SOLD') sorted.sort(compareBySaleDateDesc);
    else sorted.sort(compareByName);
    return sorted;
  }, [baseItems, statusFilter, search, groupNameForItem]);

  // Batch-purchased items don't carry their own purchase_date/bought_from --
  // only individually quick-added items do -- so fall back to the parent
  // group's purchase date, matching how the group's own "Purchased" date
  // covers everything bought in that batch.
  function purchaseDateFor(item: InventoryItemRow): string | null {
    return item.purchase_date ?? groupById(item.group_id)?.purchase_date ?? null;
  }

  async function changeStatus(item: InventoryItemRow, status: ItemStatus) {
    setBusyId(item.id);
    setActionError(null);
    try {
      await api.patch(`/api/items/${item.id}`, { status });
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update item');
    } finally {
      setBusyId(null);
    }
  }

  // Rows are div/tr elements (not real buttons, since they contain nested
  // interactive controls a <button> can't legally wrap) -- this keeps them
  // reachable and operable by keyboard the same way a click would be.
  function handleRowKeyDown(e: KeyboardEvent, item: InventoryItemRow) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setEditingItem(item);
    }
  }

  async function deleteItem(item: InventoryItemRow) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setBusyId(item.id);
    setActionError(null);
    try {
      await api.delete(`/api/items/${item.id}`);
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete item');
    } finally {
      setBusyId(null);
    }
  }

  if (loading && items.length === 0) return <InventorySkeleton />;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-10`}
            placeholder="Search name, category, or group…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={`${inputClass} w-full sm:w-auto`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ItemStatus)}
        >
          <option value="ALL">All statuses</option>
          {ITEM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-400 sm:ml-auto">
          {filtered.length} of {baseItems.length} shown &middot; {groups.length} groups
        </span>
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {filtered.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">No items match your filters.</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {filtered.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setEditingItem(item)}
                onKeyDown={(e) => handleRowKeyDown(e, item)}
                className={`${cardClass} cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${busyId === item.id ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.category} &middot; {groupNameForItem(item) || 'No group'}
                    </p>
                  </div>
                  <button
                    disabled={busyId === item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    className={dangerTextButtonClass}
                    aria-label="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div
                  className="mt-3 flex flex-wrap items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <StatusSelect status={item.status} disabled={busyId === item.id} onChange={(status) => changeStatus(item, status)} />
                  <span className="font-semibold text-slate-900 dark:text-white">{formatPhp(item.assigned_cost)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Purchased {formatDate(purchaseDateFor(item))}
                  {item.status === 'SOLD' && <> &middot; Sold {formatDate(item.sale_date)}</>}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className={`${cardClass} hidden overflow-x-auto p-0 md:block`}>
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Group</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Assigned Cost</th>
                  <th className="px-5 py-3 font-semibold">Purchased</th>
                  <th className="px-5 py-3 font-semibold">Sold</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setEditingItem(item)}
                    onKeyDown={(e) => handleRowKeyDown(e, item)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50/70 focus:outline-none focus-visible:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/50 dark:hover:bg-slate-800/40 dark:focus-visible:bg-slate-800/40 ${busyId === item.id ? 'opacity-50' : ''}`}
                  >
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.category}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{groupNameForItem(item) || '—'}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <StatusSelect status={item.status} disabled={busyId === item.id} onChange={(status) => changeStatus(item, status)} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-white">{formatPhp(item.assigned_cost)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-300">{formatDate(purchaseDateFor(item))}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-300">{formatDate(item.sale_date)}</td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <button disabled={busyId === item.id} onClick={() => deleteItem(item)} className={dangerTextButtonClass} aria-label="Delete item">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingItem && <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} />}
    </div>
  );
}
