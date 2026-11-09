export const SLOT_OPTIONS = [
  { value: 'morning', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

export const slotLabel = (slot) =>
  SLOT_OPTIONS.find((s) => s.value === slot)?.label ?? slot;
