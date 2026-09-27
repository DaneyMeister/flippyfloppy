import { Router } from 'express';
import * as groupsService from '../services/groupsService';
import { isUuid, validateGroupPatch } from '../validation';

const router = Router();

// A malformed id can't match any group; answer 404 before it reaches Postgres.
router.param('id', (_req, res, next, id) => {
  if (!isUuid(id)) return res.status(404).json({ error: 'Group not found' });
  next();
});

router.get('/', async (_req, res) => {
  try {
    const groups = await groupsService.getAllGroups();
    res.json(groups);
  } catch (err) {
    console.error('List groups failed:', err);
    res.status(500).json({ error: 'Failed to load groups' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const group = await groupsService.getGroupById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    console.error('Get group failed:', err);
    res.status(500).json({ error: 'Failed to load group' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const body = req.body ?? {};
    const invalid = validateGroupPatch(body);
    if (invalid) return res.status(400).json({ error: invalid });

    const { groupName, groupType, purchaseDate, baseCost, boughtFrom } = body;
    const updated = await groupsService.updateGroup(req.params.id, { groupName, groupType, purchaseDate, baseCost, boughtFrom });
    if (!updated) return res.status(404).json({ error: 'Group not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update group failed:', err);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

export default router;
