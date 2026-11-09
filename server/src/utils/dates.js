// All dates are plain 'YYYY-MM-DD' strings. We never convert them to Date
// objects for comparison, which avoids timezone bugs.

const pad = (n) => String(n).padStart(2, '0');

function dateToString(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Today's date using the server's local date
function todayString() {
  return dateToString(new Date());
}

// Rejects things like 2026-02-31 that match the pattern but aren't real dates
function isValidDateString(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// '2026-10-15' -> '2026-10-01'
function firstOfMonth(s) {
  return `${s.slice(0, 8)}01`;
}

// '2026-10-15' -> { from: '2026-09-01', to: '2026-09-30' }
// '2026-01-10' -> { from: '2025-12-01', to: '2025-12-31' }
function previousMonthRange(s) {
  let [y, m] = s.split('-').map(Number);
  m -= 1;
  if (m === 0) { m = 12; y -= 1; }
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate(); // day 0 of next month
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(lastDay)}` };
}

module.exports = { dateToString, todayString, isValidDateString, firstOfMonth, previousMonthRange };
