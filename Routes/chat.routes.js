import { Router } from "express";
import { createOrFetchChat, createGroupChat, getUserChats } from "../Controllers/chat.controller.js";
import  auth  from "../Middleware/auth.js";

const chatRouter = Router();

chatRouter.post("/", auth, createOrFetchChat);
chatRouter.post("/group", auth, createGroupChat);
chatRouter.get("/", auth, getUserChats);

export default chatRouter;
