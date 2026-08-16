import dns from "node:dns/promises";
import net from "node:net";
import validator from "validator";

// Common URL shorteners - not dangerous by themselves, but they hide the real
// destination, which is exactly what phishing links rely on.
const SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
  "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy"
];

// TLDs that show up disproportionately often in phishing/spam campaigns
// because they are cheap or free to register in bulk.
const RISKY_TLDS = [
  "zip", "mov", "xyz", "top", "gq", "tk", "ml", "cf", "ga", "work",
  "click", "loan", "date", "party", "review", "country", "kim"
];

// Words that legit brands use too, but that show up constantly in phishing
// pages trying to create urgency or impersonate a login/payment flow.
const SUSPICIOUS_KEYWORDS = [
  "login", "signin", "verify", "verification", "account", "update",
  "secure", "security", "confirm", "password", "bank", "wallet",
  "invoice", "billing", "suspended", "unlock", "gift", "prize", "winner"
];

// A handful of frequently-impersonated brand names. If one shows up in the
// hostname but the hostname isn't actually that brand's domain, it's a
// classic typosquat / lookalike-domain pattern.
const IMPERSONATED_BRANDS = [
  "paypal", "google", "facebook", "instagram", "apple", "microsoft",
  "amazon", "netflix", "bankofamerica", "chase", "wellsfargo", "irs",
  "whatsapp", "outlook", "linkedin"
];

function addFlag(flags, label, detail, weight) {
  flags.push({ label, detail, weight });
}

function isIpHost(hostname) {
  return net.isIP(hostname) !== 0;
}

function countChar(str, char) {
  return str.split(char).length - 1;
}

/**
 * Runs a battery of cheap, offline heuristics against a URL and returns a
 * 0-100 risk score plus the individual signals that contributed to it.
 * This is a teaching/demo-grade heuristic engine, NOT a replacement for a
 * real threat-intel feed (Google Safe Browsing, VirusTotal, PhishTank, etc).
 */
export async function analyzeUrl(rawUrl) {
  const flags = [];
  let score = 0;

  // --- Basic shape validation -------------------------------------------------
  let normalized = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = "http://" + normalized; // assume http so URL() can parse it
  }

  if (!validator.isURL(normalized, { require_protocol: true })) {
    return {
      valid: false,
      error: "That doesn't look like a valid URL. Try something like https://example.com"
    };
  }

  const parsed = new URL(normalized);
  const hostname = parsed.hostname.toLowerCase();
  const fullUrl = normalized;

  // --- 1. Protocol check --------------------------------------------------
  if (parsed.protocol === "http:") {
    addFlag(flags, "No HTTPS", "Site does not use encrypted HTTPS (uses plain http://).", 12);
    score += 12;
  }

  // --- 2. Raw IP address instead of a domain name -------------------------
  if (isIpHost(hostname)) {
    addFlag(flags, "Raw IP address", "URL uses a raw IP address instead of a domain name, a common phishing/malware hosting trick.", 25);
    score += 25;
  }

  // --- 3. "@" symbol in the URL (classic redirect trick) ------------------
  if (rawUrl.includes("@")) {
    addFlag(flags, "'@' in URL", "Contains an '@' symbol, often used to trick browsers into visiting a different host than the one displayed.", 20);
    score += 20;
  }

  // --- 4. Punycode / homograph domains (xn--) ------------------------------
  if (hostname.includes("xn--")) {
    addFlag(flags, "Punycode domain", "Domain uses punycode encoding, sometimes used to visually spoof a trusted brand with lookalike characters.", 20);
    score += 20;
  }

  // --- 5. Excessive subdomains ---------------------------------------------
  const subdomainCount = hostname.split(".").length - 2;
  if (subdomainCount >= 3) {
    addFlag(flags, "Too many subdomains", `Hostname has ${subdomainCount} subdomain levels (e.g. "secure.login.account.example.com"), often used to bury the real domain.`, 15);
    score += 15;
  }

  // --- 6. Excessive hyphens in hostname ------------------------------------
  const hyphenCount = countChar(hostname, "-");
  if (hyphenCount >= 3) {
    addFlag(flags, "Many hyphens", `Hostname contains ${hyphenCount} hyphens, a pattern common in auto-generated phishing domains.`, 10);
    score += 10;
  }

  // --- 7. Risky / bulk-registered TLD --------------------------------------
  const tld = hostname.split(".").pop();
  if (RISKY_TLDS.includes(tld)) {
    addFlag(flags, "High-risk domain extension", `The ".${tld}" extension is disproportionately used for spam and phishing campaigns.`, 15);
    score += 15;
  }

  // --- 8. URL shortener -----------------------------------------------------
  if (SHORTENERS.includes(hostname)) {
    addFlag(flags, "URL shortener", "This is a shortened link, meaning the real destination is hidden until you click it.", 10);
    score += 10;
  }

  // --- 9. Suspicious keywords in the full URL -------------------------------
  const lowerUrl = fullUrl.toLowerCase();
  const matchedKeywords = SUSPICIOUS_KEYWORDS.filter((kw) => lowerUrl.includes(kw));
  if (matchedKeywords.length >= 2) {
    addFlag(
      flags,
      "Urgency / credential-harvesting language",
      `URL contains multiple sensitive-action keywords: ${matchedKeywords.join(", ")}.`,
      Math.min(matchedKeywords.length * 6, 18)
    );
    score += Math.min(matchedKeywords.length * 6, 18);
  }

  // --- 10. Brand impersonation in hostname (basic typosquat check) ---------
  const impersonated = IMPERSONATED_BRANDS.find((brand) => {
    const isRealDomain = hostname === `${brand}.com` || hostname.endsWith(`.${brand}.com`);
    return hostname.includes(brand) && !isRealDomain;
  });
  if (impersonated) {
    addFlag(
      flags,
      "Possible brand impersonation",
      `Hostname mentions "${impersonated}" but the domain itself isn't ${impersonated}.com — a common lookalike-domain tactic.`,
      25
    );
    score += 25;
  }

  // --- 11. Extremely long URL -------------------------------------------------
  if (fullUrl.length > 100) {
    addFlag(flags, "Unusually long URL", `URL is ${fullUrl.length} characters long. Long URLs are sometimes used to obscure the real target.`, 8);
    score += 8;
  }

  // --- 12. DNS resolution check (does the domain even exist?) --------------
  try {
    await dns.lookup(hostname);
  } catch {
    addFlag(flags, "Domain does not resolve", "This domain could not be resolved via DNS — it may be fake, offline, or newly taken down.", 20);
    score += 20;
  }

  score = Math.min(score, 100);

  let verdict = "safe";
  if (score >= 60) verdict = "dangerous";
  else if (score >= 25) verdict = "suspicious";

  return {
    valid: true,
    url: fullUrl,
    hostname,
    riskScore: score,
    verdict,
    flags
  };
}
