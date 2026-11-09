import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { todayString, formatDate } from '../dates.js';
import ReadingForm from '../components/ReadingForm.jsx';
import ReadingList from '../components/ReadingList.jsx';

export default function Readings() {
  const [date, setDate] = useState(todayString());
  const [readings, setReadings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getReadings(date);
      setReadings(data.readings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(values) {
    if (editing) {
      await api.updateReading(editing.id, values);
      setEditing(null);
    } else {
      await api.addReading(values);
    }
    if (values.date !== date) setDate(values.date); // jump to the day just saved
    else await load();
  }

  async function handleDelete(reading) {
    if (!window.confirm('Delete this reading?')) return;
    try {
      await api.deleteReading(reading.id);
      if (editing?.id === reading.id) setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <ReadingForm
        key={editing ? `edit-${editing.id}` : `add-${date}`}
        initial={editing ?? { date }}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />

      <section className="card">
        <div className="row between">
          <h2>Readings for {formatDate(date)}</h2>
          <label className="inline">
            Show date
            <input type="date" value={date} max={todayString()}
                   onChange={(e) => e.target.value && setDate(e.target.value)} />
          </label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? <p className="muted">Loading…</p> : (
          <ReadingList readings={readings} onEdit={setEditing} onDelete={handleDelete} />
        )}
      </section>
    </>
  );
}
