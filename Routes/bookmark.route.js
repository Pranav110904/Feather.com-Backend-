import { Router } from "express";

import { bookmarkTweet } from "../Controllers/bookmarks.controller.js";
import { removeBookmark,getBookmarks } from "../Controllers/bookmarks.controller.js";



const routerBookmark=Router();



routerBookmark.post("/:id/bookmark", bookmarkTweet);
routerBookmark.delete("/:id/bookmark", removeBookmark);
routerBookmark.get("/bookmarks", getBookmarks);


export default routerBookmark;