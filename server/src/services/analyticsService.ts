import { pool } from '../db/pool';

/**
 * Dashboard totals + per-group summaries. Mirrors the getters on
 * InventoryController (totalExpenses, totalRevenue, netProfit,
 * totalLiquidAssets, sellingItemCount, groupSummaries).
 */
export async function getDashboardSummary() {
  const groupsRes = await pool.query(`
    SELECT
      g.id, g.group_name, g.group_type, g.purchase_date, g.base_cost, g.bought_from,
      COALESCE(exp.total_expenses, 0) AS additional_expenses,
      COALESCE(items.item_count, 0) AS item_count,
      COALESCE(items.total_assigned_cost, 0) AS total_assigned_cost,
      COALESCE(items.revenue, 0) AS revenue
    FROM item_groups g
    LEFT JOIN (
      SELECT group_id, SUM(amount) AS total_expenses
      FROM group_expenses
      GROUP BY group_id
    ) exp ON exp.group_id = g.id
    LEFT JOIN (
      SELECT group_id,
        COUNT(*) AS item_count,
        SUM(assigned_cost) AS total_assigned_cost,
        SUM(COALESCE(sold_price, 0)) AS revenue
      FROM inventory_items
      GROUP BY group_id
    ) items ON items.group_id = g.id
    ORDER BY g.purchase_date DESC
  `);

  const groupSummaries = groupsRes.rows.map((g) => {
    const totalCost = Number(g.base_cost) + Number(g.additional_expenses);
    const revenue = Number(g.revenue);
    return {
      group: {
        id: g.id,
        groupName: g.group_name,
        groupType: g.group_type,
        purchaseDate: g.purchase_date,
        baseCost: Number(g.base_cost),
        boughtFrom: g.bought_from,
      },
      totalCost,
      totalAssignedCost: Number(g.total_assigned_cost),
      revenue,
      netProfit: revenue - totalCost,
      itemCount: Number(g.item_count),
    };
  });

  const totalExpenses = groupSummaries.reduce((sum, g) => sum + g.totalCost, 0);

  const totalsRes = await pool.query(`
    SELECT
      COALESCE(SUM(sold_price) FILTER (WHERE status = 'SOLD'), 0) AS total_revenue,
      COALESCE(SUM(assigned_cost) FILTER (WHERE status = 'SELLING'), 0) AS total_liquid_assets,
      COUNT(*) FILTER (WHERE status = 'SELLING') AS selling_item_count
    FROM inventory_items
  `);
  const totals = totalsRes.rows[0];
  const totalRevenue = Number(totals.total_revenue);
  const totalLiquidAssets = Number(totals.total_liquid_assets);
  const sellingItemCount = Number(totals.selling_item_count);

  return {
    totalExpenses,
    totalRevenue,
    netProfit: totalRevenue - totalExpenses,
    totalLiquidAssets,
    sellingItemCount,
    groupSummaries,
  };
}

/**
 * Monthly report: expenses/revenue/profit + top category for sold items in
 * the given month. Mirrors InventoryController.getMonthlyReport.
 */
export async function getMonthlyReport(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const expensesRes = await pool.query(
    `
    SELECT COALESCE(SUM(g.base_cost), 0) + COALESCE((
      SELECT SUM(e.amount) FROM group_expenses e
      JOIN item_groups g2 ON g2.id = e.group_id
      WHERE g2.purchase_date BETWEEN $1 AND $2
    ), 0) AS total_expenses
    FROM item_groups g
    WHERE g.purchase_date BETWEEN $1 AND $2
    `,
    [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
  );

  const soldItemsRes = await pool.query(
    `
    SELECT * FROM inventory_items
    WHERE status = 'SOLD' AND sale_date BETWEEN $1 AND $2
    ORDER BY sale_date DESC
    `,
    [start.toISOString(), end.toISOString()]
  );

  const soldItems = soldItemsRes.rows;
  const totalRevenue = soldItems.reduce((sum, item) => sum + Number(item.sold_price ?? 0), 0);

  const counts: Record<string, number> = {};
  for (const item of soldItems) {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
  }
  let topCategory = 'None';
  let maxCount = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      topCategory = cat;
    }
  }

  const totalExpenses = Number(expensesRes.rows[0].total_expenses);

  return {
    totalExpenses,
    totalRevenue,
    netProfit: totalRevenue - totalExpenses,
    itemsSold: soldItems.length,
    topCategory,
    soldItems,
  };
}

/**
 * Keyword price lookup across name/category/notes, with average acquired
 * cost, average/highest sold price, and sale history. Mirrors
 * InventoryController.lookupByKeyword.
 */
export async function priceLookup(keyword: string) {
  const normalized = keyword.trim();
  if (!normalized) {
    return { keyword: '', matches: [], averageAcquiredCost: 0, averageSoldPrice: 0, highestSoldPrice: 0, history: [] };
  }

  const { rows: matches } = await pool.query(
    `
    SELECT * FROM inventory_items
    WHERE name ILIKE $1 OR category ILIKE $1 OR notes ILIKE $1
    `,
    [`%${normalized}%`]
  );

  const averageAcquiredCost = matches.length
    ? matches.reduce((sum, item) => sum + Number(item.assigned_cost), 0) / matches.length
    : 0;

  const soldItems = matches.filter((item) => item.status === 'SOLD' && item.sold_price != null);
  const averageSoldPrice = soldItems.length
    ? soldItems.reduce((sum, item) => sum + Number(item.sold_price), 0) / soldItems.length
    : 0;
  const highestSoldPrice = soldItems.length
    ? Math.max(...soldItems.map((item) => Number(item.sold_price)))
    : 0;

  const history = soldItems
    .map((item) => ({
      name: item.name,
      buyerName: item.buyer_name,
      soldPrice: Number(item.sold_price),
      saleDate: item.sale_date,
      status: item.status,
    }))
    .sort((a, b) => new Date(b.saleDate ?? 0).getTime() - new Date(a.saleDate ?? 0).getTime());

  return { keyword, matches, averageAcquiredCost, averageSoldPrice, highestSoldPrice, history };
}
