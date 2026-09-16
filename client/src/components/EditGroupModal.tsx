import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { EditItemModal } from './EditItemModal';
import { api, ApiError } from '../api/client';
import {
  EXPENSE_CATEGORIES,
  GROUP_TYPES,
  INVENTORY_CATEGORIES,
  ITEM_STATUSES,
  type GroupType,
  type InventoryItemRow,
  type ItemStatus,
} from '../types';
import { formatPhp, parseMoney } from '../utils/format';
import { buttonClass, inputClass, secondaryButtonClass } from './FormField';

export function EditGroupModal({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const { groupById, itemsForGroup, refresh } = useInventory();
  const group = groupById(groupId);
  const items = itemsForGroup(groupId);

  const [name, setName] = useState(group?.group_name ?? '');
  const [groupType, setGroupType] = useState<GroupType>(group?.group_type ?? GROUP_TYPES[0]);
  const [purchaseDate, setPurchaseDate] = useState(group?.purchase_date?.slice(0, 10) ?? '');
  const [boughtFrom, setBoughtFrom] = useState(group?.bought_from ?? '');
  const [baseCost, setBaseCost] = useState(String(group?.base_cost ?? '0'));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItemRow | null>(null);

  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState(INVENTORY_CATEGORIES[0]);
  const [newStatus, setNewStatus] = useState<ItemStatus>(ITEM_STATUSES[0]);
  const [newCost, setNewCost] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [addingComponent, setAddingComponent] = useState(false);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!group) return null;

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError('Enter a group name.');
    if (!purchaseDate) return setError('Select a purchase date.');

    setSaving(true);
    try {
      await api.patch(`/api/groups/${groupId}`, {
        groupName: name.trim(),
        groupType,
        purchaseDate,
        baseCost: parseMoney(baseCost),
        boughtFrom: boughtFrom.trim() || null,
      });
      await refresh();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save group');
    } finally {
      setSaving(false);
    }
  }

  async function deleteComponent(item: InventoryItemRow) {
    if (!confirm(`Permanently delete "${item.name}" from inventory?`)) return;
    setBusyId(item.id);
    setError(null);
    try {
      await api.delete(`/api/items/${item.id}`);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete item');
    } finally {
      setBusyId(null);
    }
  }

  async function addComponent() {
    if (!newName.trim()) return setError('Enter a component name.');
    setAddingComponent(true);
    setError(null);
    try {
      await api.post('/api/items', {
        groupId,
        name: newName.trim(),
        category: newCategory,
        status: newStatus,
        assignedCost: parseMoney(newCost),
        notes: newNotes.trim() || null,
      });
      await refresh();
      setNewName('');
      setNewCost('');
      setNewNotes('');
      setShowAddComponent(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add component');
    } finally {
      setAddingComponent(false);
    }
  }

  async function deleteExpense(expenseId: string) {
    setError(null);
    try {
      await api.delete(`/api/expenses/${expenseId}`);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete expense');
    }
  }

  async function addExpense() {
    const amount = parseMoney(expenseAmount);
    if (amount < 0) return setError('Enter a valid amount.');
    setAddingExpense(true);
    setError(null);
    try {
      await api.post('/api/expenses', { groupId, expenses: [{ category: expenseCategory, amount }] });
      await refresh();
      setExpenseAmount('');
      setShowAddExpense(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add expense');
    } finally {
      setAddingExpense(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <h2 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">Edit {group.group_type}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Group Details</h3>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Group Name</span>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Base Cost (₱)</span>
              <input className={inputClass} value={baseCost} onChange={(e) => setBaseCost(e.target.value)} inputMode="decimal" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Group Type</span>
                <select className={inputClass} value={groupType} onChange={(e) => setGroupType(e.target.value as GroupType)}>
                  {GROUP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Purchase Date</span>
                <input type="date" className={inputClass} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bought From</span>
              <input className={inputClass} value={boughtFrom} onChange={(e) => setBoughtFrom(e.target.value)} />
            </label>
            <button onClick={handleSave} disabled={saving} className={`w-full ${buttonClass}`}>
              <Save size={16} />
              {saving ? 'Saving…' : 'Save Group Details'}
            </button>
          </div>

          {/* Components */}
          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Components ({items.length})</h3>
              <button onClick={() => setShowAddComponent((v) => !v)} className={secondaryButtonClass}>
                <Plus size={15} />
                Add
              </button>
            </div>

            {showAddComponent && (
              <div className="mb-3 space-y-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <input className={inputClass} placeholder="Component name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <select className={inputClass} value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                    {INVENTORY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select className={inputClass} value={newStatus} onChange={(e) => setNewStatus(e.target.value as ItemStatus)}>
                    {ITEM_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <input className={inputClass} placeholder="Assigned cost (₱)" value={newCost} onChange={(e) => setNewCost(e.target.value)} inputMode="decimal" />
                <input className={inputClass} placeholder="Notes (optional)" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
                <button onClick={addComponent} disabled={addingComponent} className={`w-full ${buttonClass}`}>
                  {addingComponent ? 'Adding…' : 'Add Component'}
                </button>
              </div>
            )}

            {items.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No components yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800 ${busyId === item.id ? 'opacity-50' : ''}`}
                  >
                    <button onClick={() => setEditingItem(item)} className="min-w-0 flex-1 text-left">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                    </button>
                    <button
                      onClick={() => deleteComponent(item)}
                      disabled={busyId === item.id}
                      className="text-red-500 hover:text-red-600 disabled:opacity-50"
                      aria-label="Delete component"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses */}
          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">Additional Expenses</h3>
              <button onClick={() => setShowAddExpense((v) => !v)} className={secondaryButtonClass}>
                <Plus size={15} />
                Add
              </button>
            </div>

            {showAddExpense && (
              <div className="mb-3 flex items-center gap-3">
                <select className={inputClass} value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input className={`${inputClass} w-32`} placeholder="Amount" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} inputMode="decimal" />
                <button onClick={addExpense} disabled={addingExpense} className={buttonClass}>
                  {addingExpense ? 'Adding…' : 'Add'}
                </button>
              </div>
            )}

            {(group.group_expenses ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No additional expenses yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {(group.group_expenses ?? []).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{expense.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900 dark:text-white">{formatPhp(expense.amount)}</span>
                      <button onClick={() => deleteExpense(expense.id)} className="text-red-500 hover:text-red-600" aria-label="Delete expense">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingItem && <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} />}
    </div>
  );
}
