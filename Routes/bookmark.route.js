import { Router } from "express";

import { bookmarkTweet } from "../Controllers/bookmarks.controller.js";
import { removeBookmark,getBookmarks } from "../Controllers/bookmarks.controller.js";
import auth from "../Middleware/auth.js";



const routerBookmark=Router();



routerBookmark.post("/:id", auth, bookmarkTweet);
routerBookmark.delete("/:id", auth, removeBookmark);
routerBookmark.get("/bookmarks", auth, getBookmarks);


export default routerBookmark;