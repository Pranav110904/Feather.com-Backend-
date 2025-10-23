import Router from "express";

import { removeBookmark } from "../Controllers/bookmarks.controller";


const routerBookmark=Router();



routerBookmark.post("/:id/bookmark", bookmarkTweet);
routerBookmark.delete("/:id/bookmark", removeBookmark);


export default routerBookmark;