import { useState } from 'react';
import { Package, Zap } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { api, ApiError } from '../api/client';
import {
  EXPENSE_CATEGORIES,
  GROUP_TYPES,
  INVENTORY_CATEGORIES,
  ITEM_STATUSES,
  SHARED_RUNNING_COST_GROUP_NAMES,
  type GroupType,
  type ItemStatus,
} from '../types';
import { buttonClass, cardClass, inputClass, secondaryButtonClass } from '../components/FormField';
import { parseMoney } from '../utils/format';

interface ComponentDraft {
  key: number;
  name: string;
  category: string;
  status: ItemStatus;
  assignedCost: string;
  notes: string;
  listingUrl: string;
}

interface ExpenseDraft {
  key: number;
  category: string;
  amount: string;
}

let keySeq = 0;
const nextKey = () => ++keySeq;

function newComponent(): ComponentDraft {
  return { key: nextKey(), name: '', category: INVENTORY_CATEGORIES[0], status: ITEM_STATUSES[0], assignedCost: '', notes: '', listingUrl: '' };
}
function newExpense(): ExpenseDraft {
  return { key: nextKey(), category: EXPENSE_CATEGORIES[0], amount: '' };
}

export function AcquisitionPage() {
  const { refresh } = useInventory();
  const [mode, setMode] = useState<'batch' | 'quick'>('batch');

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => setMode('batch')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'batch' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Package size={16} />
          Batch Purchase
        </button>
        <button
          onClick={() => setMode('quick')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'quick' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Zap size={16} />
          Quick Add
        </button>
      </div>

      {mode === 'batch' ? <BatchForm onSaved={refresh} /> : <QuickAddForm onSaved={refresh} />}
    </div>
  );
}

function BatchForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<GroupType>(GROUP_TYPES[0]);
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [baseCost, setBaseCost] = useState('');
  const [boughtFrom, setBoughtFrom] = useState('');
  const [expenses, setExpenses] = useState<ExpenseDraft[]>([]);
  const [components, setComponents] = useState<ComponentDraft[]>([newComponent()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function updateComponent(key: number, patch: Partial<ComponentDraft>) {
    setComponents((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }
  function updateExpense(key: number, patch: Partial<ExpenseDraft>) {
    setExpenses((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }

  async function handleSubmit() {
    setError(null);
    setMessage(null);

    if (!groupName.trim()) return setError('Enter a group name.');
    if (!boughtFrom.trim()) return setError('Enter source/vendor.');
    if (components.some((c) => !c.name.trim())) return setError('Every component needs a name.');

    setSaving(true);
    try {
      await api.post('/api/items/batch', {
        groupName: groupName.trim(),
        groupType,
        purchaseDate,
        baseCost: parseMoney(baseCost),
        boughtFrom: boughtFrom.trim(),
        additionalExpenses: expenses.map((e) => ({ category: e.category, amount: parseMoney(e.amount) })),
        components: components.map((c) => ({
          name: c.name.trim(),
          category: c.category,
          status: c.status,
          assignedCost: parseMoney(c.assignedCost),
          listedPrice: parseMoney(c.assignedCost),
          notes: c.notes.trim() || null,
          listingUrl: c.listingUrl.trim() || null,
        })),
      });
      await onSaved();
      setMessage('Batch purchase saved and inventory items added.');
      setGroupName('');
      setBaseCost('');
      setBoughtFrom('');
      setExpenses([]);
      setComponents([newComponent()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save batch purchase');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-teal-600">{message}</p>}

      <section className={cardClass}>
        <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-50">Purchase Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Group Name</span>
            <input className={inputClass} value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Group Type</span>
            <select className={inputClass} value={groupType} onChange={(e) => setGroupType(e.target.value as GroupType)}>
              {GROUP_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Purchase Date</span>
            <input type="date" className={inputClass} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Base Cost (₱)</span>
            <input className={inputClass} value={baseCost} onChange={(e) => setBaseCost(e.target.value)} inputMode="decimal" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Bought From</span>
            <input className={inputClass} value={boughtFrom} onChange={(e) => setBoughtFrom(e.target.value)} />
          </label>
        </div>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-slate-50">Additional Expenses</h2>
          <button className={secondaryButtonClass} onClick={() => setExpenses((prev) => [...prev, newExpense()])}>
            + Add
          </button>
        </div>
        {expenses.length === 0 ? (
          <p className="text-sm text-slate-500">No additional expenses yet.</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.key} className="flex items-center gap-3">
                <select
                  className={inputClass}
                  value={expense.category}
                  onChange={(e) => updateExpense(expense.key, { category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  className={`${inputClass} w-32`}
                  placeholder="Cost"
                  value={expense.amount}
                  onChange={(e) => updateExpense(expense.key, { amount: e.target.value })}
                  inputMode="decimal"
                />
                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => setExpenses((prev) => prev.filter((e) => e.key !== expense.key))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-slate-50">Components</h2>
          <button className={secondaryButtonClass} onClick={() => setComponents((prev) => [...prev, newComponent()])}>
            + Add
          </button>
        </div>
        <div className="space-y-4">
          {components.map((component, index) => (
            <div key={component.key} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Component {index + 1}</span>
                {components.length > 1 && (
                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => setComponents((prev) => prev.filter((c) => c.key !== component.key))}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Component Name</span>
                  <input className={inputClass} value={component.name} onChange={(e) => updateComponent(component.key, { name: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Category</span>
                  <select className={inputClass} value={component.category} onChange={(e) => updateComponent(component.key, { category: e.target.value })}>
                    {INVENTORY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Status</span>
                  <select className={inputClass} value={component.status} onChange={(e) => updateComponent(component.key, { status: e.target.value as ItemStatus })}>
                    {ITEM_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Assigned Cost (₱)</span>
                  <input className={inputClass} value={component.assignedCost} onChange={(e) => updateComponent(component.key, { assignedCost: e.target.value })} inputMode="decimal" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Notes</span>
                  <input className={inputClass} value={component.notes} onChange={(e) => updateComponent(component.key, { notes: e.target.value })} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Listing Link</span>
                  <input className={inputClass} value={component.listingUrl} onChange={(e) => updateComponent(component.key, { listingUrl: e.target.value })} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button disabled={saving} onClick={handleSubmit} className={`w-full ${buttonClass}`}>
        {saving ? 'Saving…' : 'Save Batch Purchase'}
      </button>
    </div>
  );
}

function QuickAddForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const [targetGroup, setTargetGroup] = useState(SHARED_RUNNING_COST_GROUP_NAMES[0]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(INVENTORY_CATEGORIES[0]);
  const [status, setStatus] = useState<ItemStatus>(ITEM_STATUSES[0]);
  const [baseCost, setBaseCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [boughtFrom, setBoughtFrom] = useState('');
  const [listingUrl, setListingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [expenses, setExpenses] = useState<ExpenseDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function updateExpense(key: number, patch: Partial<ExpenseDraft>) {
    setExpenses((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }

  async function handleSubmit() {
    setError(null);
    setMessage(null);
    if (!name.trim()) return setError('Enter a component name.');
    if (!boughtFrom.trim()) return setError('Enter source/vendor.');

    setSaving(true);
    try {
      await api.post('/api/items/quick-add', {
        name: name.trim(),
        category,
        status,
        purchaseDate,
        boughtFrom: boughtFrom.trim(),
        baseCost: parseMoney(baseCost),
        targetGroupName: targetGroup,
        notes: notes.trim() || null,
        listingUrl: listingUrl.trim() || null,
        additionalExpenses: expenses.map((e) => ({ category: e.category, amount: parseMoney(e.amount) })),
      });
      await onSaved();
      setMessage(`Item added to ${targetGroup}.`);
      setName('');
      setBaseCost('');
      setBoughtFrom('');
      setListingUrl('');
      setNotes('');
      setExpenses([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add item');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-teal-600">{message}</p>}

      <section className={cardClass}>
        <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-50">Item Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Add To</span>
            <select className={inputClass} value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}>
              {SHARED_RUNNING_COST_GROUP_NAMES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Component Name</span>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</span>
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {INVENTORY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</span>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)}>
              {ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Base Cost (₱)</span>
            <input className={inputClass} value={baseCost} onChange={(e) => setBaseCost(e.target.value)} inputMode="decimal" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Purchase Date</span>
            <input type="date" className={inputClass} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Bought From</span>
            <input className={inputClass} value={boughtFrom} onChange={(e) => setBoughtFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Listing Link</span>
            <input className={inputClass} value={listingUrl} onChange={(e) => setListingUrl(e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</span>
            <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>
      </section>

      <section className={cardClass}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-slate-50">Additional Expenses</h2>
          <button className={secondaryButtonClass} onClick={() => setExpenses((prev) => [...prev, newExpense()])}>
            + Add
          </button>
        </div>
        {expenses.length === 0 ? (
          <p className="text-sm text-slate-500">No additional expenses yet.</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.key} className="flex items-center gap-3">
                <select className={inputClass} value={expense.category} onChange={(e) => updateExpense(expense.key, { category: e.target.value })}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input className={`${inputClass} w-32`} placeholder="Cost" value={expense.amount} onChange={(e) => updateExpense(expense.key, { amount: e.target.value })} inputMode="decimal" />
                <button className="text-sm text-red-600 hover:underline" onClick={() => setExpenses((prev) => prev.filter((e) => e.key !== expense.key))}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <button disabled={saving} onClick={handleSubmit} className={`w-full ${buttonClass}`}>
        {saving ? 'Adding…' : 'Add Item'}
      </button>
    </div>
  );
}
