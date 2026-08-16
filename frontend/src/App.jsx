import { useEffect, useState } from "react";
import URLChecker from "./components/URLChecker.jsx";
import RiskGauge from "./components/RiskGauge.jsx";
import FlagList from "./components/FlagList.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import ChatBot from "./components/ChatBot.jsx";
import { scanUrl, getHistory } from "./api.js";
import "./styles/App.css";

export default function App() {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    refreshHistory();
  }, []);

  async function refreshHistory() {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch {
      // history is a nice-to-have; fail silently if the API isn't up yet
    }
  }

  async function handleScan(url) {
    setScanning(true);
    setError(null);
    try {
      const data = await scanUrl(url);
      setResult(data);
      refreshHistory();
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark">◈</span>
          <span className="app__brand-name">LinkGuard</span>
        </div>
        <p className="app__tagline">Paste a link. We'll tell you if it smells like a scam.</p>
      </header>

      <main className="app__main">
        <section className="app__scan-section">
          <URLChecker onScan={handleScan} scanning={scanning} />

          {error && <p className="app__error">{error}</p>}

          {(scanning || result) && (
            <div className="result">
              <RiskGauge score={result?.riskScore ?? 0} verdict={result?.verdict ?? "safe"} scanning={scanning} />
              <div className="result__details">
                {result && !scanning && (
                  <>
                    <p className="result__hostname">{result.hostname}</p>
                    <FlagList flags={result.flags} />
                  </>
                )}
              </div>
            </div>
          )}

          {!scanning && !result && !error && (
            <div className="empty-state">
              <p>No scan yet. Try pasting a suspicious link above — even a fake one you make up works for testing.</p>
            </div>
          )}
        </section>

        <HistoryPanel history={history} onSelect={setResult} />
      </main>

      <ChatBot scanContext={result} />
    </div>
  );
}
