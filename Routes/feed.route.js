import { Router } from "express";
import auth from "../Middleware/auth.js";
import { createTweet } from "../Controllers/tweet.controller.js";
import { getFeed } from "../Controllers/feed.controller.js";

const feedRouter = Router();


feedRouter.post("/tweet", auth, createTweet);
feedRouter.get("/feed", auth, getFeed);

export default feedRouter;
