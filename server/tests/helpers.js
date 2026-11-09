const fs = require('fs');
const path = require('path');
const pool = require('../src/db');
const { dateToString } = require('../src/utils/dates');

async function setupDb() {
  const sql = fs.readFileSync(path.join(__dirname, '../src/db/schema.sql'), 'utf8');
  await pool.query(sql);
}

async function resetDb() {
  await pool.query('TRUNCATE readings, users RESTART IDENTITY CASCADE');
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateToString(d);
}

module.exports = { pool, setupDb, resetDb, daysAgo };
