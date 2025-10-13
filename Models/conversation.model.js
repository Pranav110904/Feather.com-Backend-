import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  name: { type: String, default: null },         // group name or null for 1-1
  isGroup: { type: Boolean, default: false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
}, { timestamps: true });

// index for fast lookup of conversations by participant
conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
export default Conversation;
