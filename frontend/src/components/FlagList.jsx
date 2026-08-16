export default function FlagList({ flags }) {
  if (!flags || flags.length === 0) {
    return (
      <div className="flags flags--empty">
        <p>No red flags found. Still, never enter passwords or card details unless you're sure of the site.</p>
      </div>
    );
  }

  return (
    <ul className="flags">
      {flags
        .slice()
        .sort((a, b) => b.weight - a.weight)
        .map((flag, i) => (
          <li className="flags__item" key={i}>
            <span className="flags__weight">+{flag.weight}</span>
            <div>
              <p className="flags__label">{flag.label}</p>
              <p className="flags__detail">{flag.detail}</p>
            </div>
          </li>
        ))}
    </ul>
  );
}
