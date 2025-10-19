import Chat  from "../Models/chat.model.js";
import Message  from "../Models/message.model.js";
import User from "../Models/user.model.js";
import Follow from "../Models/follow.model.js";
import uploadImageCloudinary from "../Utils/uploadImageToCloudinary.js";
import {
    deletFilesFromCloudinary,
    emitEvent,
    uploadFilesToCloudinary,
} from "../Utils/feature.js";
import { ErrorHandler } from "../utils/utility.js";

// Utility: check mutual followers
const areMutualFollowers = async (userA, userB) => {
    try {
        const followsAtoB = await Follow.findOne({ follower: userA, following: userB });
        const followsBtoA = await Follow.findOne({ follower: userB, following: userA });
        return !!(followsAtoB && followsBtoA);
    } catch (err) {
        console.error(err);
        return false;
    }
};

/**
 * Create or fetch one-to-one chat
 */
export const createOrFetchChat = async (req, res) => {
    try {
        const { userId } = req.body;
        const currentUser = req.userId;

        const canChat = await areMutualFollowers(currentUser, userId);
        if (!canChat)
            return res.status(403).json({ success: false, message: "Both users must follow each other to chat." });

        let chat = await Chat.findOne({
            groupChat: false,
            members: { $all: [currentUser, userId], $size: 2 }
        }).populate("members", "name username avatar");

        if (!chat) {
            chat = await Chat.create({ name: "Private Chat", members: [currentUser, userId] });
        }

        res.status(200).json({ success: true, chat });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Create group chat
 */
export const createGroupChat = async (req, res) => {
    try {
        const { name, members } = req.body;
        const creatorId = req.userId;
        const avatar = req.file;

        if (!name || !members || members.length === 0)
            return res.status(400).json({ success: false, message: "Group name and members required." });

        const allMembers = [creatorId, ...members];

        // Verify mutual follow for all members
        for (let i = 0; i < allMembers.length; i++) {
            for (let j = i + 1; j < allMembers.length; j++) {
                const mutual = await areMutualFollowers(allMembers[i], allMembers[j]);
                if (!mutual)
                    return res.status(403).json({
                        success: false,
                        message: `Users ${allMembers[i]} and ${allMembers[j]} are not mutual followers.`,
                    });
            }
        }

        let uploadedAvatar = null;
        if (avatar) {
            uploadedAvatar = await uploadImageCloudinary(avatar);
        }

        const groupChat = await Chat.create({
            name,
            groupChat: true,
            creator: creatorId,
            members: allMembers,
            avatar: uploadedAvatar?.url || "",
        });

        emitEvent(req, "ALERT", allMembers, `Welcome to ${name} group`);
        emitEvent(req, "REFETCH_CHATS", allMembers);

        res.status(201).json({ success: true, message: "Group created", groupChat });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Get all chats for a user
 */
export const getUserChats = async (req, res) => {
    try {
        const chats = await Chat.find({ members: req.userId })
            .populate("members", "name username avatar")
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, chats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Add members to group
 */
export const addMembers = async (req, res) => {
    try {
        const { chatId, members } = req.body;
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
        if (!chat.groupChat) return res.status(400).json({ success: false, message: "Not a group chat" });
        if (chat.creator.toString() !== req.userId.toString())
            return res.status(403).json({ success: false, message: "Not allowed to add members" });

        const newMembers = [];
        for (let memberId of members) {
            const user = await User.findById(memberId);
            if (user && !chat.members.includes(memberId)) newMembers.push(memberId);
        }

        chat.members.push(...newMembers);
        await chat.save();

        emitEvent(req, "ALERT", chat.members, `New members added`);
        emitEvent(req, "REFETCH_CHATS", chat.members);

        res.status(200).json({ success: true, message: "Members added" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Remove member from group
 */
export const removeMember = async (req, res) => {
    try {
        const { chatId, userId } = req.body;
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
        if (!chat.groupChat) return res.status(400).json({ success: false, message: "Not a group chat" });
        if (chat.creator.toString() !== req.userId.toString())
            return res.status(403).json({ success: false, message: "Not allowed" });

        chat.members = chat.members.filter(m => m.toString() !== userId.toString());
        await chat.save();

        emitEvent(req, "ALERT", chat.members, `Member removed`);
        emitEvent(req, "REFETCH_CHATS", chat.members);

        res.status(200).json({ success: true, message: "Member removed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Leave group
 */
export const leaveGroup = async (req, res) => {
    try {
        const chatId = req.params.id;
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

        chat.members = chat.members.filter(m => m.toString() !== req.userId.toString());

        // Assign new creator if original left
        if (chat.creator.toString() === req.userId.toString() && chat.members.length > 0) {
            chat.creator = chat.members[0];
        }

        await chat.save();

        emitEvent(req, "ALERT", chat.members, `User left the group`);
        emitEvent(req, "REFETCH_CHATS", chat.members);

        res.status(200).json({ success: true, message: "Left group" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Rename group
 */
export const renameGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const chatId = req.params.id;
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
        if (!chat.groupChat) return res.status(400).json({ success: false, message: "Not a group chat" });
        if (chat.creator.toString() !== req.userId.toString())
            return res.status(403).json({ success: false, message: "Not allowed to rename" });

        chat.name = name;
        await chat.save();

        emitEvent(req, "REFETCH_CHATS", chat.members);

        res.status(200).json({ success: true, message: "Group renamed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Delete chat
 */
export const deleteChat = async (req, res) => {
    try {
        const chatId = req.params.id;
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

        if (chat.groupChat && chat.creator.toString() !== req.userId.toString())
            return res.status(403).json({ success: false, message: "Not allowed to delete group" });
        if (!chat.groupChat && !chat.members.includes(req.userId))
            return res.status(403).json({ success: false, message: "Not allowed to delete chat" });

        const messagesWithAttachments = await Message.find({ chat: chatId, attachments: { $exists: true, $ne: [] } });
        const public_ids = messagesWithAttachments.flatMap(msg => msg.attachments.map(a => a.public_id));

        await Promise.all([
            deletFilesFromCloudinary(public_ids),
            chat.deleteOne(),
            Message.deleteMany({ chat: chatId }),
        ]);

        emitEvent(req, "REFETCH_CHATS", chat.members);

        res.status(200).json({ success: true, message: "Chat deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
