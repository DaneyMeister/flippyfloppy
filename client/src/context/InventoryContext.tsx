import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { InventoryItemRow, ItemGroupRow } from '../types';

interface InventoryContextValue {
  groups: ItemGroupRow[];
  items: InventoryItemRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  groupById: (id: string | null | undefined) => ItemGroupRow | undefined;
  groupNameForItem: (item: InventoryItemRow) => string;
  itemsForGroup: (groupId: string) => InventoryItemRow[];
  searchInventoryItems: (query: string, limit?: number) => InventoryItemRow[];
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<ItemGroupRow[]>([]);
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State is only set in the fetch's callbacks, so the first load can run
  // from an effect without a synchronous setState.
  const load = useCallback(
    () =>
      Promise.all([api.get<ItemGroupRow[]>('/api/groups'), api.get<InventoryItemRow[]>('/api/items')])
        .then(([groupsData, itemsData]) => {
          setGroups(groupsData);
          setItems(itemsData);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load inventory'))
        .finally(() => setLoading(false)),
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    await load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const groupById = useCallback((id: string | null | undefined) => groups.find((g) => g.id === id), [groups]);

  const groupNameForItem = useCallback(
    (item: InventoryItemRow) => groupById(item.group_id)?.group_name ?? '',
    [groupById]
  );

  const itemsForGroup = useCallback((groupId: string) => items.filter((i) => i.group_id === groupId), [items]);

  const searchInventoryItems = useCallback(
    (query: string, limit = 8) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        return [...items].sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit);
      }
      return items
        .filter(
          (item) =>
            item.name.toLowerCase().includes(normalized) ||
            item.category.toLowerCase().includes(normalized) ||
            item.status.toLowerCase().includes(normalized) ||
            (item.notes ?? '').toLowerCase().includes(normalized) ||
            (item.buyer_name ?? '').toLowerCase().includes(normalized) ||
            groupNameForItem(item).toLowerCase().includes(normalized)
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, limit);
    },
    [items, groupNameForItem]
  );

  const value = useMemo(
    () => ({ groups, items, loading, error, refresh, groupById, groupNameForItem, itemsForGroup, searchInventoryItems }),
    [groups, items, loading, error, refresh, groupById, groupNameForItem, itemsForGroup, searchInventoryItems]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}
