import Router from "express";
import { bookmarkTweet,removeBookmark } from "../Controllers/bookmarks.controller";


const routerBookmark=Router();



routerBookmark.post("/:id", bookmarkTweet);


export default routerBookmark;