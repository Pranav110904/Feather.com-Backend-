import { Router } from "express";

import { bookmarkTweet } from "../Controllers/bookmarks.controller.js";
import { removeBookmark } from "../Controllers/bookmarks.controller.js";



const routerBookmark=Router();



routerBookmark.post("/:id/bookmark", bookmarkTweet);
routerBookmark.delete("/:id/bookmark", removeBookmark);


export default routerBookmark;