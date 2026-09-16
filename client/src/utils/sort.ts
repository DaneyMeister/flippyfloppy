import { ITEM_STATUSES, type InventoryItemRow } from '../types';

const STATUS_PRIORITY: string[] = ITEM_STATUSES.filter((s) => s !== 'SOLD');

// Mirrors InventoryController.compareByPriority's inline categoryOrder map
// from the original Flutter app -- intentionally not the same list as
// INVENTORY_CATEGORIES, so keep this in sync with that source, not with the
// category dropdown options.
const CATEGORY_PRIORITY: Record<string, number> = {
  MOBO: 0,
  CPU: 1,
  GPU: 2,
  RAM: 3,
  SSD: 4,
  HDD: 5,
  CASE: 7,
  PSU: 6,
  MONITOR: 8,
  LAPTOP: 9,
  PERIPHERAL: 10,
};

/**
 * Default active-inventory sort: status priority (SELLING, TESTER,
 * COLLECTION, USING, DEFECTIVE), then category priority, then name --
 * mirrors InventoryController.compareByPriority.
 */
export function compareByPriority(a: InventoryItemRow, b: InventoryItemRow): number {
  const statusA = a.status.trim().toUpperCase();
  const statusB = b.status.trim().toUpperCase();
  const weightA = STATUS_PRIORITY.indexOf(statusA);
  const weightB = STATUS_PRIORITY.indexOf(statusB);
  const statusCompare = (weightA === -1 ? 99 : weightA) - (weightB === -1 ? 99 : weightB);
  if (statusCompare !== 0) return statusCompare;

  const catA = a.category.trim().toUpperCase();
  const catB = b.category.trim().toUpperCase();
  const catWeightA = CATEGORY_PRIORITY[catA] ?? 99;
  const catWeightB = CATEGORY_PRIORITY[catB] ?? 99;
  if (catWeightA !== catWeightB) return catWeightA - catWeightB;

  return a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase());
}

/**
 * Sort used by the group detail sheet's item list, mirroring the Flutter
 * app's _openGroupSpecs: plain status order (SELLING, SOLD, TESTER,
 * COLLECTION, USING, DEFECTIVE) -- note SOLD is included here, unlike
 * compareByPriority's active-inventory ordering.
 */
export function compareByGroupItemStatus(a: InventoryItemRow, b: InventoryItemRow): number {
  const weightA = ITEM_STATUSES.indexOf(a.status);
  const weightB = ITEM_STATUSES.indexOf(b.status);
  return (weightA === -1 ? ITEM_STATUSES.length : weightA) - (weightB === -1 ? ITEM_STATUSES.length : weightB);
}

export function compareByName(a: InventoryItemRow, b: InventoryItemRow): number {
  return a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase());
}

export function compareBySaleDateDesc(a: InventoryItemRow, b: InventoryItemRow): number {
  return new Date(b.sale_date ?? 0).getTime() - new Date(a.sale_date ?? 0).getTime();
}

/**
 * Dashboard group-card bucket order, mirroring
 * DashboardScreen._groupBucketPriority in the original Flutter app: Bought
 * Components first, then System Units, PC Sets, Bundle Sets, Defective
 * Items, Personal/Extra Peripherals, Collection Set, then any group named
 * "Lolo Jhun" last (even though it's a PC Set by type), everything else
 * after that.
 */
export function groupBucketPriority(groupName: string, groupType: string): number {
  const name = groupName.trim().toLowerCase();
  if (name === 'bought components') return 0;
  if (name.includes('lolo jhun')) return 7;
  if (groupType === 'System Unit') return 1;
  if (groupType === 'PC Set') return 2;
  if (groupType === 'Bundle Set') return 3;
  if (name.includes('defective')) return 4;
  if (name.includes('personal') || name.includes('peripheral')) return 5;
  if (name.includes('collection')) return 6;
  return 8;
}
