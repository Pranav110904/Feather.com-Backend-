import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema(
  {
    // 🔹 Who posted the tweet
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 The main text of the tweet
    content: {
      type: String,
      maxlength: 280,
      trim: true,
      required: [true, "Tweet cannot be empty"],
    },

    // 🔹 Optional media (image, video, voice tweet)
    media: {
      type: {
        url: String,
        type: {
          type: String,
          enum: ["image", "video", "audio", "none"],
          default: "none",
        },
      },
      default: null,
    },

    // 🔹 Categories / hashtags (used for feed sorting)
    categories: [
      {
        type: String,
        trim: true,
      },
    ],

    // 🔹 Reactions (like LinkedIn style)
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: {
          type: String,
          enum: ["like", "love", "insightful", "funny", "support", "celebrate"],
        },
      },
    ],

    // 🔹 Comments
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 🔹 Retweets / Reposts
    retweetedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // 🔹 For AI-generated tweets
    generatedByAI: {
      type: Boolean,
      default: false,
    },

    // 🔹 Mood status (optional, if user attaches their mood)
    mood: {
      type: String,
      enum: ["happy", "sad", "excited", "tired", "neutral"],
      default: "neutral",
    },

    // 🔹 Visibility and timestamps
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

const Tweet = mongoose.models.Tweet || mongoose.model("Tweet", tweetSchema);
export default Tweet;
