import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { validateLogin } from '../validation';

const router = Router();

// Slows down password guessing: 10 tries per 15 minutes from one address.
// Successful logins don't count, so the owner is never locked out by their own use.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const body = req.body ?? {};
    const invalid = validateLogin(body);
    if (invalid) return res.status(400).json({ error: 'username and password are required' });
    const { username, password } = body;

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
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
