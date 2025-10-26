import {Router} from "express";
import { getExploreData,getSubCategoryTrends, getHashtagTweets } from "../Controllers/explore.controller.js";
import auth from "../Middleware/auth.js";

const exploreRouter = Router();

// exploreRouter.get("/",auth, getExploreData);
// exploreRouter.get("/hashtag/:tag",auth, getHashtagTweets);

exploreRouter.get("/", getExploreData);
exploreRouter.get("/explore/subcategory", getSubCategoryTrends); // ?sub=sports
exploreRouter.get("/explore/hashtag/:tag", getHashtagTweets);


export default exploreRouter;
