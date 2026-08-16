# LinkGuard — Scam/Phishing URL Checker (MERN + AI chat)

A practice hackathon project: paste a URL, get a 0–100 risk score with the
reasons behind it, see your scan history, and ask an AI assistant questions
about the results — all in a MongoDB + Express + React + Node.js stack.

## How it decides "spam or not"

There's no paid threat-intel API wired in by default. Instead
`backend/utils/urlAnalyzer.js` runs a set of well-known phishing heuristics:

- no HTTPS
- raw IP address instead of a domain
- `@` symbol in the URL (host-spoofing trick)
- punycode domains (`xn--…`, used for lookalike characters)
- too many subdomains / too many hyphens
- risky/bulk-registered TLDs (`.zip`, `.top`, `.gq`, …)
- known URL shorteners
- urgency/credential-harvesting keywords (`login`, `verify`, `suspended`, …)
- basic brand-impersonation check (e.g. "paypal" in the hostname but the
  domain isn't paypal.com)
- unusually long URLs
- domain doesn't resolve in DNS at all

Each hit adds "weight" to a risk score, which maps to `safe` / `suspicious`
/ `dangerous`. This is intentionally simple and explainable — good for a demo
— but it is **not** a real security product. See "Leveling it up" below for
how to plug in a real feed.

## Stack

- **Frontend:** React + Vite, plain CSS (no framework), dark "terminal/security"
  themed UI with a radial risk gauge
- **Backend:** Node.js + Express
- **Database:** MongoDB (via Mongoose) — stores every scan so you get a history feed
- **AI chat:** Anthropic API (Claude) — answers questions about flags / online safety

## Project structure

```
scam-checker/
├── backend/
│   ├── models/ScanResult.js      # Mongoose schema for saved scans
│   ├── routes/scan.js            # POST /api/scan, GET /api/scan/history
│   ├── routes/chat.js            # POST /api/chat (AI assistant)
│   ├── utils/urlAnalyzer.js      # the heuristic scoring engine
│   ├── server.js                 # Express app entry point
│   └── .env.example
└── frontend/
    └── src/
        ├── components/           # URLChecker, RiskGauge, FlagList, HistoryPanel, ChatBot
        ├── styles/                # index.css (tokens), App.css
        ├── api.js                 # fetch helpers
        └── App.jsx
```

## Setup

### 1. MongoDB
Easiest for a hackathon: create a free cluster at
[MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and copy the connection
string. Or run MongoDB locally with `mongod` / Docker:
```bash
docker run -d -p 27017:27017 --name scam-mongo mongo
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGODB_URI, and ANTHROPIC_API_KEY for the chatbot
npm run dev
```
Runs on `http://localhost:5000`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173` and proxies `/api/*` to the backend.

Open `http://localhost:5173`, paste a URL, hit **Scan**.

## Try it with these test cases

- `https://google.com` → should come back safe
- `http://192.168.1.1/login` → raw IP + no HTTPS + keyword flags
- `http://paypal-secure-login.verify-account.xyz` → brand impersonation + risky TLD + keywords
- `http://bit.ly/3xample` → shortener flag

## Leveling it up for judges

If you have time before the hackathon, these are the highest-impact upgrades:
1. **Real threat intel:** wire in [Google Safe Browsing](https://developers.google.com/safe-browsing) or
   [VirusTotal](https://developers.virustotal.com/reference/overview) in `urlAnalyzer.js` and blend their
   verdict into the score.
2. **Auth:** add user accounts (JWT) so scan history is per-user instead of global.
3. **Screenshot preview:** capture a headless-browser screenshot of the target site so users can eyeball it
   without visiting it directly.
4. **Rate limiting** on `/api/scan` so the demo can't be spammed.

## Notes

- The chatbot needs `ANTHROPIC_API_KEY` in `backend/.env` — without it, the
  scanning feature still works fine, the chat just returns a friendly error.
- This is a learning/demo project. Don't rely on it (or any single tool) as
  your only line of defense against phishing — when in doubt, don't click.
