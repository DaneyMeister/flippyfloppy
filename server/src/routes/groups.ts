import { Router } from 'express';
import * as groupsService from '../services/groupsService';

const router = Router();

router.get('/', async (_req, res) => {
  const groups = await groupsService.getAllGroups();
  res.json(groups);
});

router.get('/:id', async (req, res) => {
  const group = await groupsService.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
});

router.patch('/:id', async (req, res) => {
  const { groupName, groupType, purchaseDate, baseCost, boughtFrom } = req.body ?? {};
  const updated = await groupsService.updateGroup(req.params.id, { groupName, groupType, purchaseDate, baseCost, boughtFrom });
  if (!updated) return res.status(404).json({ error: 'Group not found' });
  res.json(updated);
});

export default router;
