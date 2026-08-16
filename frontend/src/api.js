const BASE = "/api";

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export async function scanUrl(url) {
  const res = await fetch(`${BASE}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });
  return handle(res);
}

export async function getHistory(limit = 15) {
  const res = await fetch(`${BASE}/scan/history?limit=${limit}`);
  return handle(res);
}

export async function sendChatMessage(message, history, scanContext) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, scanContext })
  });
  return handle(res);
}
