import { Router } from "express";
import ScanResult from "../models/ScanResult.js";
import { analyzeUrl } from "../utils/urlAnalyzer.js";

const router = Router();

// POST /api/scan  { url: "https://example.com" }
router.post("/", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Please provide a 'url' string in the request body." });
    }

    const result = await analyzeUrl(url);
    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    const saved = await ScanResult.create({
      url: result.url,
      hostname: result.hostname,
      riskScore: result.riskScore,
      verdict: result.verdict,
      flags: result.flags
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ error: "Something went wrong while scanning that URL." });
  }
});

// GET /api/scan/history?limit=20
router.get("/history", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const history = await ScanResult.find().sort({ createdAt: -1 }).limit(limit);
    res.json(history);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Could not load scan history." });
  }
});

// GET /api/scan/:id
router.get("/:id", async (req, res) => {
  try {
    const scan = await ScanResult.findById(req.params.id);
    if (!scan) return res.status(404).json({ error: "Scan not found." });
    res.json(scan);
  } catch (err) {
    res.status(500).json({ error: "Could not load that scan." });
  }
});

export default router;
