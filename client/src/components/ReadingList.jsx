import { slotLabel } from '../constants.js';

export default function ReadingList({ readings, onEdit, onDelete }) {
  if (readings.length === 0) {
    return <p className="empty">No readings for this date yet. Add your first one above 👆</p>;
  }
  return (
    <table className="table">
      <thead>
        <tr><th>Slot</th><th>Value (mg/dl)</th><th></th></tr>
      </thead>
      <tbody>
        {readings.map((r) => (
          <tr key={r.id}>
            <td>{slotLabel(r.slot)}</td>
            <td><strong>{r.value}</strong></td>
            <td className="actions">
              <button className="btn-link" onClick={() => onEdit(r)}>Edit</button>
              <button className="btn-link danger" onClick={() => onDelete(r)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
