import { useState } from 'react';
import { SLOT_OPTIONS } from '../constants.js';
import { todayString } from '../dates.js';

// Same rules as the server, so the user gets instant feedback.
// The server still re-checks everything (and enforces slot / max-4 rules).
export function validateForm({ date, slot, value }) {
  if (String(value).trim() === '') return 'Please enter a glucose value.';
  const num = Number(value);
  if (!Number.isInteger(num) || num < 40 || num > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }
  if (!slot) return 'Please choose a time slot.';
  if (!date) return 'Please select a valid date.';
  if (date > todayString()) return 'Date cannot be in the future.';
  return null;
}

export default function ReadingForm({ initial, onSubmit, onCancel }) {
  const [date, setDate] = useState(initial?.date ?? todayString());
  const [slot, setSlot] = useState(initial?.slot ?? 'morning');
  const [value, setValue] = useState(initial?.value ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial?.id);

  async function handleSubmit(e) {
    e.preventDefault();
    const problem = validateForm({ date, slot, value });
    if (problem) return setError(problem);

    setError('');
    setSaving(true);
    try {
      await onSubmit({ date, slot, value: Number(value) });
      if (!editing) setValue('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit} noValidate>
      <h2>{editing ? 'Edit reading' : 'Add a reading'}</h2>

      <label>
        Date
        <input type="date" value={date} max={todayString()} onChange={(e) => setDate(e.target.value)} />
      </label>

      <label>
        Time slot
        <select value={slot} onChange={(e) => setSlot(e.target.value)}>
          {SLOT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </label>

      <label>
        Glucose (mg/dl)
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 110"
        />
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="row">
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add reading'}
        </button>
        {editing && <button className="btn secondary" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
