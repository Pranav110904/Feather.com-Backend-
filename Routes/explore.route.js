import {Router} from "express";
import { getExploreData, getHashtagTweets } from "../Controllers/explore.controller.js";
import auth from "../Middleware/auth.js";

const exploreRouter = Router();

exploreRouter.get("/",auth, getExploreData);
exploreRouter.get("/hashtag/:tag",auth, getHashtagTweets);

export default exploreRouter;
