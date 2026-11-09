import { formatRange } from '../dates.js';

export default function ReportCard({ title, range, stats, children }) {
  const empty = !stats || stats.count === 0;
  return (
    <section className="card">
      <h2>{title}</h2>
      <p className="muted">{formatRange(range.from, range.to)}</p>

      {empty ? (
        <p className="empty">No readings in this period yet.</p>
      ) : (
        <div className="stats">
          <div><span>Highest</span><strong>{stats.highest}</strong></div>
          <div><span>Lowest</span><strong>{stats.lowest}</strong></div>
          <div><span>Average</span><strong>{stats.average.toFixed(1)}</strong></div>
          <div><span>Readings</span><strong>{stats.count}</strong></div>
        </div>
      )}
      {!empty && children}
    </section>
  );
}
