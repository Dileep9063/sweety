const { SLOT_LABELS } = require('../constants');
const { isValidDateString, todayString } = require('../utils/dates');

// Format checks only (no database). Returns { error } or { data: { date, slot, value } }
function validateReadingInput(body = {}) {
  const { value, slot, date } = body;

  if (value === undefined || value === null || String(value).trim() === '') {
    return { error: 'Please enter a glucose value.' };
  }
  const num = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isInteger(num) || num < 40 || num > 600) {
    return { error: 'Value must be between 40 and 600 mg/dl.' };
  }

  if (!SLOT_LABELS[slot]) return { error: 'Please choose a time slot.' };

  if (!isValidDateString(date)) return { error: 'Please select a valid date.' };
  if (date > todayString()) return { error: 'Date cannot be in the future.' };

  return { data: { date, slot, value: num } };
}

module.exports = { validateReadingInput };
