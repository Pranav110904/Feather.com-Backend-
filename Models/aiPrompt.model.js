import mongoose from "mongoose";

const aiPromptSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    promptText: { 
      type: String, 
      required: true 
    },
    generatedText: { 
      type: String, 
      required: true 
    },
    usedInTweet: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Tweet", 
      default: null 
    },
    modelUsed: { 
      type: String, 
      default: "Gemini-2.0-flash" 
    },
    status: { 
      type: String, 
      enum: ["completed", "failed"], 
      default: "completed" 
    },
  },
  { timestamps: true }
);

const AIPrompt = mongoose.models.AIPrompt || mongoose.model("AIPrompt", aiPromptSchema);
export default AIPrompt;
