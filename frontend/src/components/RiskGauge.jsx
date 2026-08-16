const VERDICT_COLOR = {
  safe: "var(--green)",
  suspicious: "var(--amber)",
  dangerous: "var(--red)"
};

const VERDICT_LABEL = {
  safe: "Looks safe",
  suspicious: "Suspicious",
  dangerous: "High risk"
};

export default function RiskGauge({ score, verdict, scanning }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = scanning ? 0.28 : score / 100;
  const offset = circumference * (1 - progress);
  const color = scanning ? "var(--cyan)" : VERDICT_COLOR[verdict];

  return (
    <div className="gauge" role="img" aria-label={scanning ? "Scanning" : `Risk score ${score} out of 100, ${VERDICT_LABEL[verdict]}`}>
      <svg width="180" height="180" viewBox="0 0 180 180" className={scanning ? "gauge__svg gauge__svg--scanning" : "gauge__svg"}>
        <circle cx="90" cy="90" r={radius} className="gauge__track" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
          className="gauge__progress"
        />
      </svg>
      <div className="gauge__center">
        {scanning ? (
          <>
            <span className="gauge__scanning-text">SCANNING</span>
            <span className="gauge__dots">···</span>
          </>
        ) : (
          <>
            <span className="gauge__score" style={{ color }}>
              {score}
            </span>
            <span className="gauge__label">{VERDICT_LABEL[verdict]}</span>
          </>
        )}
      </div>
    </div>
  );
}
