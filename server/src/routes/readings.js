const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { SLOT_LABELS, MAX_READINGS_PER_DAY } = require('../constants');
const { validateReadingInput } = require('../validation/reading');
const { isValidDateString } = require('../utils/dates');

router.use(auth); // every route below needs a logged-in user

const COLUMNS = 'id, reading_date AS date, slot, value';

// Run fn inside a transaction while holding a lock on the user's row.
// This stops two simultaneous requests from both slipping past the "max 4" check.
async function withUserLock(userId, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Business rules that need the database. excludeId = the reading being edited.
async function findConflict(db, userId, date, slot, excludeId = 0) {
  const { rows } = await db.query(
    'SELECT slot FROM readings WHERE user_id = $1 AND reading_date = $2 AND id <> $3',
    [userId, date, excludeId]
  );
  if (rows.length >= MAX_READINGS_PER_DAY) {
    return 'You can add only 4 readings per day.';
  }
  if (rows.some((r) => r.slot === slot)) {
    const label = SLOT_LABELS[slot].replace(/ \(fasting\)$/, '');
    const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
    return `You already have ${article} ${label} reading for this date.`;
  }
  return null;
}

// CREATE
router.post('/', async (req, res, next) => {
  try {
    const v = validateReadingInput(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const { date, slot, value } = v.data;

    const out = await withUserLock(req.user.id, async (db) => {
      const conflict = await findConflict(db, req.user.id, date, slot);
      if (conflict) return { error: conflict };
      const { rows } = await db.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1,$2,$3,$4) RETURNING ${COLUMNS}`,
        [req.user.id, date, slot, value]
      );
      return { reading: rows[0] };
    });

    if (out.error) return res.status(409).json({ error: out.error });
    res.status(201).json({ reading: out.reading });
  } catch (err) { next(err); }
});

// LIST  (optional ?date=YYYY-MM-DD)
router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (date !== undefined && !isValidDateString(date)) {
      return res.status(400).json({ error: 'Please select a valid date.' });
    }

    const params = [req.user.id];
    let where = 'user_id = $1';
    if (date) { params.push(date); where += ' AND reading_date = $2'; }

    const { rows } = await pool.query(
      `SELECT ${COLUMNS} FROM readings WHERE ${where}
       ORDER BY reading_date DESC,
         CASE slot WHEN 'morning' THEN 1 WHEN 'after_breakfast' THEN 2
                   WHEN 'after_lunch' THEN 3 ELSE 4 END`,
      params
    );
    res.json({ readings: rows });
  } catch (err) { next(err); }
});

// UPDATE
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Reading not found.' });

    const v = validateReadingInput(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const { date, slot, value } = v.data;

    const out = await withUserLock(req.user.id, async (db) => {
      const own = await db.query(
        'SELECT 1 FROM readings WHERE id = $1 AND user_id = $2', [id, req.user.id]
      );
      if (!own.rowCount) return { notFound: true };

      const conflict = await findConflict(db, req.user.id, date, slot, id);
      if (conflict) return { error: conflict };

      const { rows } = await db.query(
        `UPDATE readings SET reading_date = $1, slot = $2, value = $3
         WHERE id = $4 AND user_id = $5 RETURNING ${COLUMNS}`,
        [date, slot, value, id, req.user.id]
      );
      return { reading: rows[0] };
    });

    if (out.notFound) return res.status(404).json({ error: 'Reading not found.' });
    if (out.error) return res.status(409).json({ error: out.error });
    res.json({ reading: out.reading });
  } catch (err) { next(err); }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: 'Reading not found.' });

    const { rowCount } = await pool.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2', [id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Reading not found.' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
