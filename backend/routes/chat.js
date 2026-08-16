import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

const MODEL = "gemini-3.5-flash";

const SYSTEM_PROMPT = `You are the in-app helper for "LinkGuard", a website scam/phishing checker built for a
student hackathon project. You help users understand:
- what the risk score and flags on a scan result mean
- general online-safety tips (phishing, spoofed domains, HTTPS, 2FA, etc.)
- how to use the app (paste a URL, hit Scan, read the flags)

Keep answers short (2-5 sentences unless asked for detail), practical, and beginner-friendly.
If asked something totally unrelated to web safety or this app, gently redirect back on topic.
You are not a replacement for a real security tool - remind users of that if they ask you to
make a final call on something high-stakes (e.g. "should I enter my card number here").`;

// POST /api/chat  { message: string, history?: [{role: "user"|"assistant", content}], scanContext?: {...} }
router.post("/", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Chatbot isn't configured yet. Add GEMINI_API_KEY to backend/.env and restart the server."
      });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const { message, history = [], scanContext } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Please provide a 'message' string." });
    }

    const contextNote = scanContext
      ? `\n\nFor reference, here's the user's most recent scan result:\n${JSON.stringify(scanContext, null, 2)}`
      : "";

    // Gemini expects contents as [{ role: "user" | "model", parts: [{ text }] }]
    // Our frontend stores history with role "assistant", so it needs mapping to "model".
    const contents = [
      ...history.slice(-10).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      })),
      { role: "user", parts: [{ text: message + contextNote }] }
    ];

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 500
      }
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "The chatbot ran into an error. Check your GEMINI_API_KEY and try again." });
  }
});

export default router;