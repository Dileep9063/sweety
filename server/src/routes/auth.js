const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const pool = require('../db');
const config = require('../config');

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100, 'Name is too long.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
});

const signToken = (user) =>
  jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { name, email, password } = parsed.data;

    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
      [name, email, hash]
    );
    res.status(201).json({ user: rows[0], token: signToken(rows[0]) });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    // Same message for both cases so we don't reveal which emails exist
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token: signToken(user),
    });
  } catch (err) { next(err); }
});

module.exports = router;
