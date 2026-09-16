import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const expectedUsername = process.env.AUTH_USERNAME;
  const passwordHash = process.env.AUTH_PASSWORD_HASH;
  if (!expectedUsername || !passwordHash) {
    return res.status(500).json({ error: 'Server auth is not configured (AUTH_USERNAME / AUTH_PASSWORD_HASH)' });
  }

  if (username !== expectedUsername) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  res.json({ token });
});

export default router;
