import { Router } from "express";
import auth from "../Middleware/auth.js";
import {
    createOrFetchChat,
    createGroupChat,
    getUserChats,
    addMembers,
    removeMember,
    leaveGroup,
    renameGroup,
    deleteChat
} from "../Controllers/chat.controller.js";

const chatRouter = Router();

chatRouter.post("/", auth, createOrFetchChat);
chatRouter.post("/group", auth, createGroupChat);
chatRouter.get("/", auth, getUserChats);

chatRouter.put("/group/add-members", auth, addMembers);
chatRouter.put("/group/remove-member", auth, removeMember);
chatRouter.put("/group/leave/:id", auth, leaveGroup);
chatRouter.put("/group/rename/:id", auth, renameGroup);
chatRouter.delete("/:id", auth, deleteChat);

export default chatRouter;
