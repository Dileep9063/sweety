const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { isValidDateString, todayString, firstOfMonth, previousMonthRange } = require('../utils/dates');

router.use(auth);

// highest / lowest / average (1 decimal) / count for a date range (inclusive)
async function getStats(userId, from, to) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count,
            MAX(value)    AS highest,
            MIN(value)    AS lowest,
            ROUND(AVG(value), 1)::float AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );
  // With no readings, MAX/MIN/AVG are NULL, so the UI can show an empty state
  return rows[0];
}

// GET /api/reports?date=YYYY-MM-DD   (date defaults to today)
router.get('/', async (req, res, next) => {
  try {
    const date = req.query.date || todayString();
    if (!isValidDateString(date)) {
      return res.status(400).json({ error: 'Please select a valid date.' });
    }
    if (date > todayString()) {
      return res.status(400).json({ error: 'Date cannot be in the future.' });
    }

    const ranges = {
      daily: { from: date, to: date },
      monthToDate: { from: firstOfMonth(date), to: date },
      previousMonth: previousMonthRange(date),
    };

    const [daily, monthToDate, previousMonth, list] = await Promise.all([
      getStats(req.user.id, ranges.daily.from, ranges.daily.to),
      getStats(req.user.id, ranges.monthToDate.from, ranges.monthToDate.to),
      getStats(req.user.id, ranges.previousMonth.from, ranges.previousMonth.to),
      pool.query(
        `SELECT id, reading_date AS date, slot, value FROM readings
         WHERE user_id = $1 AND reading_date = $2
         ORDER BY CASE slot WHEN 'morning' THEN 1 WHEN 'after_breakfast' THEN 2
                            WHEN 'after_lunch' THEN 3 ELSE 4 END`,
        [req.user.id, date]
      ),
    ]);

    res.json({
      date,
      daily: { range: ranges.daily, stats: daily, readings: list.rows },
      monthToDate: { range: ranges.monthToDate, stats: monthToDate },
      previousMonth: { range: ranges.previousMonth, stats: previousMonth },
    });
  } catch (err) { next(err); }
});

module.exports = router;
