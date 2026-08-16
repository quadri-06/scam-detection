import { useState } from "react";

export default function URLChecker({ onScan, scanning }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || scanning) return;
    onScan(value.trim());
  }

  return (
    <form className="scanner-bar" onSubmit={handleSubmit}>
      <span className="scanner-bar__prompt">$</span>
      <input
        type="text"
        className="scanner-bar__input"
        placeholder="paste-a-url-to-check.com"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Website URL to check"
        autoFocus
      />
      <button type="submit" className="scanner-bar__button" disabled={scanning}>
        {scanning ? "Scanning…" : "Scan"}
      </button>
    </form>
  );
}
