import express from "express";
import { generateTweet, postTweet, getAIPrompts } from "../Controllers/aiTweet.controller.js";
import auth  from "../Middleware/auth.js"; // your auth middleware

const aiTweetRouter = express.Router();

aiTweetRouter.post("/generate-tweet", auth, generateTweet);
aiTweetRouter.post("/tweets", auth, postTweet);
aiTweetRouter.get("/prompts", auth, getAIPrompts);

export default aiTweetRouter;
