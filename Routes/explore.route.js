import {Router} from "express";
import { getExploreData,getSubCategoryTrends, getHashtagTweets } from "../Controllers/explore.controller.js";
import auth from "../Middleware/auth.js";

const exploreRouter = Router();

exploreRouter.get("/",auth, getExploreData);
exploreRouter.get("/subcategory",auth, getSubCategoryTrends);
exploreRouter.get("/hashtag/:tag",auth, getHashtagTweets);


export default exploreRouter;
