import { Router } from 'express';
import * as itemsService from '../services/itemsService';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await itemsService.getAllItemsWithGroups();
  res.json(items);
});

router.get('/:id', async (req, res) => {
  const item = await itemsService.getItemById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

router.post('/', async (req, res) => {
  try {
    const { groupId, name, category, status, assignedCost, notes } = req.body ?? {};
    if (!groupId || !name || !category || !status) {
      return res.status(400).json({ error: 'groupId, name, category, and status are required' });
    }
    const item = await itemsService.createItemInGroup({
      groupId,
      name,
      category,
      status,
      assignedCost: Number(assignedCost) || 0,
      notes,
    });
    res.status(201).json(item);
  } catch (err) {
    console.error('Create item failed:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { groupName, groupType, purchaseDate, baseCost, boughtFrom, additionalExpenses, components } = req.body ?? {};
    if (!groupName || !groupType || !purchaseDate || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ error: 'groupName, groupType, purchaseDate, and at least one component are required' });
    }
    const result = await itemsService.createBatch({
      groupName,
      groupType,
      purchaseDate,
      baseCost: Number(baseCost) || 0,
      boughtFrom: boughtFrom ?? '',
      additionalExpenses: additionalExpenses ?? [],
      components,
    });
    res.status(201).json(result);
  } catch (err) {
    console.error('Batch create failed:', err);
    res.status(500).json({ error: 'Failed to create batch purchase' });
  }
});

router.post('/quick-add', async (req, res) => {
  try {
    const {
      name, category, status, purchaseDate, boughtFrom, baseCost,
      targetGroupName, notes, listingUrl, additionalExpenses,
    } = req.body ?? {};
    if (!name || !category || !status || !purchaseDate || !targetGroupName) {
      return res.status(400).json({ error: 'name, category, status, purchaseDate, and targetGroupName are required' });
    }
    const result = await itemsService.quickAddIndividualItem({
      name,
      category,
      status,
      purchaseDate,
      boughtFrom: boughtFrom ?? '',
      baseCost: Number(baseCost) || 0,
      targetGroupName,
      notes,
      listingUrl,
      additionalExpenses: additionalExpenses ?? [],
    });
    res.status(201).json(result);
  } catch (err) {
    console.error('Quick add failed:', err);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

router.post('/sell-build', async (req, res) => {
  try {
    const { itemSoldPrices, buyerName, saleDate, listingUrl } = req.body ?? {};
    if (!itemSoldPrices || Object.keys(itemSoldPrices).length === 0 || !buyerName || !saleDate) {
      return res.status(400).json({ error: 'itemSoldPrices, buyerName, and saleDate are required' });
    }
    await itemsService.sellItemsAsBuild({ itemSoldPrices, buyerName, saleDate, listingUrl });
    res.status(204).end();
  } catch (err) {
    console.error('Sell build failed:', err);
    res.status(500).json({ error: 'Failed to sell build' });
  }
});

router.post('/return-sale', async (req, res) => {
  try {
    const { itemIds } = req.body ?? {};
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds must be a non-empty array' });
    }
    await itemsService.returnSale(itemIds);
    res.status(204).end();
  } catch (err) {
    console.error('Return sale failed:', err);
    res.status(500).json({ error: 'Failed to return sale' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updated = await itemsService.updateItem(req.params.id, req.body ?? {});
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update item failed:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await itemsService.deleteItem(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error('Delete item failed:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
