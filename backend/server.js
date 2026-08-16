import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import scanRoutes from "./routes/scan.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scam-checker";

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mongoState: mongoose.connection.readyState });
});

app.use("/api/scan", scanRoutes);
app.use("/api/chat", chatRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("   Make sure MongoDB is running, or set MONGODB_URI in backend/.env");
    process.exit(1);
  });
