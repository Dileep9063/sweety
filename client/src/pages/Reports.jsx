import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { todayString, formatDate } from '../dates.js';
import { slotLabel } from '../constants.js';
import ReportCard from '../components/ReportCard.jsx';

export default function Reports() {
  const [date, setDate] = useState(todayString());
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getReports(date)
      .then((data) => { if (!cancelled) setReport(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date]);

  return (
    <>
      <div className="card row between">
        <h1>Reports</h1>
        <label className="inline">
          Selected date
          <input type="date" value={date} max={todayString()}
                 onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {loading && !report && <p className="muted">Loading…</p>}

      {report && !error && (
        <>
          <ReportCard title={`Daily – ${formatDate(report.date)}`}
                      range={report.daily.range} stats={report.daily.stats}>
            <table className="table">
              <thead><tr><th>Slot</th><th>Value (mg/dl)</th></tr></thead>
              <tbody>
                {report.daily.readings.map((r) => (
                  <tr key={r.id}><td>{slotLabel(r.slot)}</td><td><strong>{r.value}</strong></td></tr>
                ))}
              </tbody>
            </table>
          </ReportCard>
          <ReportCard title="Month-to-date" range={report.monthToDate.range} stats={report.monthToDate.stats} />
          <ReportCard title="Previous month" range={report.previousMonth.range} stats={report.previousMonth.stats} />
        </>
      )}
    </>
  );
}
