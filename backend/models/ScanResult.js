import mongoose from "mongoose";

const flagSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    detail: { type: String, required: true },
    weight: { type: Number, required: true } // how much this flag contributed to the risk score
  },
  { _id: false }
);

const scanResultSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    hostname: { type: String, required: true },
    riskScore: { type: Number, required: true }, // 0 (safe) - 100 (high risk)
    verdict: {
      type: String,
      enum: ["safe", "suspicious", "dangerous"],
      required: true
    },
    flags: [flagSchema],
    checkedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Fast lookups for "have we scanned this before" + recent history feed
scanResultSchema.index({ url: 1, createdAt: -1 });

export default mongoose.model("ScanResult", scanResultSchema);
