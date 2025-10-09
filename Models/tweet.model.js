import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema(
  {
    author: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true 
    },
    content: {
      type: String, 
      required: [true, "Tweet content cannot be empty"], 
      maxlength: [350, "Tweet cannot exceed 280 characters"]
    },
    media: [
      {
        url: String,
        type: { type: String, enum: ["image", "video", "gif"] },
      },
    ],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["like", "love", "funny", "insightful", "support", "celebrate", "curious"], required: true },
      },
    ],
    replies: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Tweet" }
    ],
    retweets: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    // 🆕 AI Fields
    generatedByAI: 
      { 
        type: Boolean, default: false 
      },
    originalPromptId: 
      { 
        type: mongoose.Schema.Types.ObjectId, ref: "AIPrompt", default: null 
      },
  },
  { timestamps: true }
);

const Tweet = mongoose.models.Tweet || mongoose.model("Tweet", tweetSchema);
export default Tweet;
