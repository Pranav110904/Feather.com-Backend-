import mongoose from "mongoose";

const trendingBackupSchema = new mongoose.Schema({
  hashtag: { type: String, required: true },
  category: { type: String, default: "other" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("TrendingBackup", trendingBackupSchema);
