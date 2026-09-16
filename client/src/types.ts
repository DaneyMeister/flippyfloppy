export const ITEM_STATUSES = ['SELLING', 'SOLD', 'TESTER', 'COLLECTION', 'USING', 'DEFECTIVE'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const GROUP_TYPES = ['PC Set', 'System Unit', 'Bundle Set', 'Individual'] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

export const BOUGHT_COMPONENTS_GROUP_NAME = 'Bought Components';

export const SHARED_RUNNING_COST_GROUP_NAMES = [
  BOUGHT_COMPONENTS_GROUP_NAME,
  'Defective Items',
  'Extra Peripherals',
  'Collection Set',
];

export const EXPENSE_CATEGORIES = ['Gas', 'Delivery Fee', 'Tip', 'GCash Protection', 'Other'] as const;

export const INVENTORY_CATEGORIES = [
  'CPU', 'CPU+Cooler', 'Cooler', 'MoBo', 'GPU', 'RAM', 'SSD', 'HDD', 'PSU',
  'Case', 'Fans', 'Case+PSU', 'Case+Fans', 'Case Bundle', 'Monitor', 'Laptop',
  'Bundle Set', 'Mouse', 'Keyboard', 'System Unit', 'PC Set',
];

// --- Raw DB row shapes, as returned by /api/groups and /api/items ---

export interface GroupExpenseRow {
  id: string;
  group_id: string;
  item_id: string | null;
  category: string;
  amount: string;
  created_at: string;
}

export interface ItemGroupRow {
  id: string;
  group_name: string;
  group_type: GroupType;
  purchase_date: string;
  base_cost: string;
  bought_from: string | null;
  created_at: string;
  group_expenses?: GroupExpenseRow[];
}

export interface InventoryItemRow {
  id: string;
  group_id: string | null;
  name: string;
  category: string;
  status: ItemStatus;
  assigned_cost: string;
  listed_price: string | null;
  sold_price: string | null;
  notes: string | null;
  buyer_name: string | null;
  sale_date: string | null;
  listing_url: string | null;
  purchase_date: string | null;
  bought_from: string | null;
  created_at: string;
  item_group?: ItemGroupRow | null;
}

// --- camelCase analytics shapes, as returned by /api/analytics ---

export interface GroupSummary {
  group: {
    id: string;
    groupName: string;
    groupType: GroupType;
    purchaseDate: string;
    baseCost: number;
    boughtFrom: string | null;
  };
  totalCost: number;
  totalAssignedCost: number;
  revenue: number;
  netProfit: number;
  itemCount: number;
}

export interface DashboardSummary {
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  totalLiquidAssets: number;
  sellingItemCount: number;
  groupSummaries: GroupSummary[];
}

export interface MonthlyReport {
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  itemsSold: number;
  topCategory: string;
  soldItems: InventoryItemRow[];
}

export interface PriceHistoryEntry {
  name: string;
  buyerName: string | null;
  soldPrice: number;
  saleDate: string | null;
  status: ItemStatus;
}

export interface PriceLookupResult {
  keyword: string;
  matches: InventoryItemRow[];
  averageAcquiredCost: number;
  averageSoldPrice: number;
  highestSoldPrice: number;
  history: PriceHistoryEntry[];
}
