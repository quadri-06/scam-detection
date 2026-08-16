const DOT_COLOR = {
  safe: "var(--green)",
  suspicious: "var(--amber)",
  dangerous: "var(--red)"
};

export default function HistoryPanel({ history, onSelect }) {
  return (
    <aside className="history">
      <h2 className="history__title">Recent scans</h2>
      {history.length === 0 ? (
        <p className="history__empty">Your scanned links will show up here.</p>
      ) : (
        <ul className="history__list">
          {history.map((item) => (
            <li key={item._id}>
              <button className="history__item" onClick={() => onSelect(item)}>
                <span className="history__dot" style={{ background: DOT_COLOR[item.verdict] }} />
                <span className="history__hostname">{item.hostname}</span>
                <span className="history__score">{item.riskScore}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
