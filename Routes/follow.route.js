 import { Router } from "express"
import { followUser, unfollowUser, getFollowers, getFollowing } from "../Controllers/follow.controller.js";
import auth from "../Middleware/auth.js";

const followRouter = Router();

// Follow / Unfollow
followRouter.post("/:followingId/follow", auth, followUser);
followRouter.post("/:followingId/unfollow", auth, unfollowUser);

// Get followers / following
followRouter.get("/:userId/followers", getFollowers);
followRouter.get("/:userId/following", getFollowing);

export default followRouter;
