const pad = (n) => String(n).padStart(2, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Today as 'YYYY-MM-DD' in the user's local time
export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// '2026-10-15' -> '15 Oct 2026'  (string parsing only, no timezone surprises)
export function formatDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// ('2026-10-01', '2026-10-15') -> '1 Oct – 15 Oct 2026'; same day -> '15 Oct 2026'
export function formatRange(from, to) {
  if (from === to) return formatDate(to);
  const [, fm, fd] = from.split('-').map(Number);
  return `${fd} ${MONTHS[fm - 1]} – ${formatDate(to)}`;
}
