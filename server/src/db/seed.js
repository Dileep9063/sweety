// Creates a demo user (demo@sweety.com / password123) with ~45 days of sample readings.
require('dotenv').config({ quiet: true });
const bcrypt = require('bcrypt');
const pool = require('../db');
const { dateToString } = require('../utils/dates');

const DEMO = { name: 'Demo Patient', email: 'demo@sweety.com', password: 'password123' };

// Typical mg/dl range per slot [min, max]
const RANGES = {
  morning: [90, 135],
  after_breakfast: [130, 185],
  after_lunch: [120, 175],
  after_dinner: [120, 180],
};
const SLOTS = Object.keys(RANGES);

// Small seeded random generator so the seed data is the same every run
let seed = 42;
const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const between = (min, max) => Math.round(min + rand() * (max - min));

(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [DEMO.email]); // readings cascade
  const hash = await bcrypt.hash(DEMO.password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id',
    [DEMO.name, DEMO.email, hash]
  );
  const userId = rows[0].id;

  let total = 0;
  for (let daysAgo = 45; daysAgo >= 0; daysAgo--) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const date = dateToString(d);

    if (rand() < 0.1) continue;                      // skip ~10% of days (no readings)
    const count = rand() < 0.5 ? 4 : between(2, 3);  // never more than 4 per day
    const slots = [...SLOTS].sort(() => rand() - 0.5).slice(0, count);

    for (const slot of slots) {
      const [min, max] = RANGES[slot];
      await pool.query(
        'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1,$2,$3,$4)',
        [userId, date, slot, between(min, max)]
      );
      total++;
    }
  }

  console.log(`Seeded ${DEMO.email} / ${DEMO.password} with ${total} readings`);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
