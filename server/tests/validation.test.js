const { validateReadingInput } = require('../src/validation/reading');
const { daysAgo } = require('./helpers');

const ok = { date: daysAgo(1), slot: 'morning', value: 100 };

describe('validateReadingInput', () => {
  test('accepts a valid reading', () => {
    expect(validateReadingInput(ok).data).toEqual(ok);
  });
  test('value is required', () => {
    expect(validateReadingInput({ ...ok, value: '' }).error).toBe('Please enter a glucose value.');
    expect(validateReadingInput({ ...ok, value: undefined }).error).toBe('Please enter a glucose value.');
  });
  test.each([39, 601, 100.5, 'abc'])('value %p is rejected', (value) => {
    expect(validateReadingInput({ ...ok, value }).error).toBe('Value must be between 40 and 600 mg/dl.');
  });
  test('boundaries 40 and 600 are allowed', () => {
    expect(validateReadingInput({ ...ok, value: 40 }).error).toBeUndefined();
    expect(validateReadingInput({ ...ok, value: 600 }).error).toBeUndefined();
  });
  test('future date is rejected', () => {
    expect(validateReadingInput({ ...ok, date: daysAgo(-1) }).error).toBe('Date cannot be in the future.');
  });
  test('today is allowed', () => {
    expect(validateReadingInput({ ...ok, date: daysAgo(0) }).error).toBeUndefined();
  });
  test('invalid slot is rejected', () => {
    expect(validateReadingInput({ ...ok, slot: 'midnight' }).error).toBe('Please choose a time slot.');
  });
});
