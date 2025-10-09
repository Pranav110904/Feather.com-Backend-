
import Tweet from "../Models/tweet.model.js";
import AIPrompt from "../Models/aiPrompt.model.js";
import { generateTweetContent } from "../Services/geminiService.js";
import { createTweetPrompt } from "../Utils/generatePromptTemplate.js";
import mongoose from "mongoose";

// 🔹 Generate a tweet using AI
export const generateTweet = async (req, res) => {
  try {
    const userId = req.userId; // Authenticated user
    const { prompt } = req.body;
    const fullPrompt = createTweetPrompt(prompt);
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ message: "Prompt cannot be empty" });
    }

    // Call your service instead of Gemini SDK directly
    const generatedText = await generateTweetContent(fullPrompt);

    // Save the AI prompt in DB
    const aiPrompt = await AIPrompt.create({
      user: userId,
      promptText: prompt,
      generatedText,
    });

    res.status(200).json({ generatedText, promptId: aiPrompt._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate tweet" });
  }
};


// 🔹 Post a tweet (AI or manual)
export const postTweet = async (req, res) => {
  try {
    const userId = req.userId; // Authenticated user
    const { content, promptId } = req.body;

    // Check for empty content
    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Tweet content cannot be empty" });
    }

    // Enforce Twitter character limit
    if (content.length > 350) {
      return res.status(400).json({ message: "Tweet cannot exceed 350 characters" });
    }

    // Create tweet
    const tweet = await Tweet.create({
      author: userId,
      content,
      generatedByAI: !!promptId,
      originalPromptId: promptId || null,
    });

    // Update the AI prompt if used
    if (promptId && mongoose.Types.ObjectId.isValid(promptId)) {
      await AIPrompt.findByIdAndUpdate(promptId, { usedInTweet: tweet._id });
    }

    res.status(200).json({ message: "Tweet posted successfully", tweet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to post tweet" });
  }
};
// 🔹 Optional: Get AI prompt history for a user
export const getAIPrompts = async (req, res) => {
  try {
    const userId = req.userId;
    const prompts = await AIPrompt.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(prompts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch AI prompts" });
  }
};
