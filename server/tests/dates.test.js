const { previousMonthRange, firstOfMonth, isValidDateString } = require('../src/utils/dates');

describe('date helpers', () => {
  test('previous month of 15 Oct 2026 is September', () => {
    expect(previousMonthRange('2026-10-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });
  test('January rolls back to December of the previous year', () => {
    expect(previousMonthRange('2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });
  test('handles leap-year February', () => {
    expect(previousMonthRange('2024-03-10')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
    expect(previousMonthRange('2026-03-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });
  test('first of month', () => {
    expect(firstOfMonth('2026-10-15')).toBe('2026-10-01');
  });
  test('rejects impossible dates', () => {
    expect(isValidDateString('2026-02-31')).toBe(false);
    expect(isValidDateString('15-10-2026')).toBe(false);
    expect(isValidDateString('2026-10-15')).toBe(true);
  });
});
