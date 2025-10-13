import { Router } from "express";
import { sendMessage, getMessages } from "../Controllers/message.controller.js";
import   auth from "../Middleware/auth.js";

const messageRouter = Router();

messageRouter.post("/", auth, sendMessage);
messageRouter.get("/:chatId", auth, getMessages);

export default messageRouter;
