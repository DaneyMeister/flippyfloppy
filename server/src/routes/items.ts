import { Router } from 'express';
import * as itemsService from '../services/itemsService';
import {
  isUuid,
  validateBatch,
  validateCreateItem,
  validateItemIds,
  validateItemPatch,
  validateQuickAdd,
  validateSellBuild,
} from '../validation';

const router = Router();

// A malformed id can't match any item; answer 404 before it reaches Postgres.
router.param('id', (_req, res, next, id) => {
  if (!isUuid(id)) return res.status(404).json({ error: 'Item not found' });
  next();
});

router.get('/', async (_req, res) => {
  try {
    const items = await itemsService.getAllItemsWithGroups();
    res.json(items);
  } catch (err) {
    console.error('List items failed:', err);
    res.status(500).json({ error: 'Failed to load items' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await itemsService.getItemById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error('Get item failed:', err);
    res.status(500).json({ error: 'Failed to load item' });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body ?? {};
    const invalid = validateCreateItem(body);
    if (invalid) return res.status(400).json({ error: invalid });

    const { groupId, name, category, status, assignedCost, notes } = body;
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
    const body = req.body ?? {};
    const invalid = validateBatch(body);
    if (invalid) return res.status(400).json({ error: invalid });

    const { groupName, groupType, purchaseDate, baseCost, boughtFrom, additionalExpenses, components } = body;
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
    const body = req.body ?? {};
    const invalid = validateQuickAdd(body);
    if (invalid) return res.status(400).json({ error: invalid });

    const {
      name, category, status, purchaseDate, boughtFrom, baseCost,
      targetGroupName, notes, listingUrl, additionalExpenses,
    } = body;
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
    const body = req.body ?? {};
    const invalid = validateSellBuild(body);
    if (invalid) return res.status(400).json({ error: invalid });

    const { itemSoldPrices, buyerName, saleDate, listingUrl } = body;
    await itemsService.sellItemsAsBuild({ itemSoldPrices, buyerName, saleDate, listingUrl });
    res.status(204).end();
  } catch (err) {
    console.error('Sell build failed:', err);
    res.status(500).json({ error: 'Failed to sell build' });
  }
});

router.post('/return-sale', async (req, res) => {
  try {
    const body = req.body ?? {};
    const invalid = validateItemIds(body);
    if (invalid) return res.status(400).json({ error: invalid });

    await itemsService.returnSale(body.itemIds);
    res.status(204).end();
  } catch (err) {
    console.error('Return sale failed:', err);
    res.status(500).json({ error: 'Failed to return sale' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const body = req.body ?? {};
    const invalid = validateItemPatch(body);
    if (invalid) return res.status(400).json({ error: invalid });

    const updated = await itemsService.updateItem(req.params.id, body);
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
