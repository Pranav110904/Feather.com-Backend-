import { Chat } from "../Models/chat.model.js";
import User  from "../Models/user.model.js";
import Follow from "../Models/follow.model.js";

/**
 * Utility: Check if two users follow each other
 */
 const areMutualFollowers = async (userA, userB) => {
   try {
     // Check if userA follows userB
     const followsAtoB = await Follow.findOne({ follower: userA, following: userB });
 
     // Check if userB follows userA
     const followsBtoA = await Follow.findOne({ follower: userB, following: userA });
 
     return !!(followsAtoB && followsBtoA);
   } catch (err) {
     console.error("Error checking mutual followers:", err);
     return false;
   }
 };

/**
 * ✅ Create or Fetch One-to-One Chat
 */
export const createOrFetchChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUser = req.userId;
    console.log(currentUser);
    console.log(userId);

    // 🧩 Mutual follow check
    const canChat = await areMutualFollowers(currentUser, userId);
    if (!canChat) {
      return res.status(403).json({
        success: false,
        message: "Both users must follow each other to start chatting.",
      });
    }

    // 🧠 Check if chat already exists
    let chat = await Chat.findOne({
      groupChat: false,
      members: { $all: [currentUser, userId], $size: 2 },
    }).populate("members", "name username avatar");

    if (!chat) {
      chat = await Chat.create({
        name: "Private Chat",
        members: [currentUser, userId],
      });
    }

    res.status(200).json({ success: true, chat });
  } catch (error) {
    console.error("Error creating/fetching chat:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Create Group Chat
 */
export const createGroupChat = async (req, res) => {
  try {
    const { name, members } = req.body;
    const creatorId = req.userId;

    // Combine creator and all members
    const allMembers = [creatorId, ...members];

    // 🔍 Verify every pair is mutually following
    for (let i = 0; i < allMembers.length; i++) {
      for (let j = i + 1; j < allMembers.length; j++) {
        const mutual = await areMutualFollowers(allMembers[i], allMembers[j]);
        if (!mutual) {
          return res.status(403).json({
            success: false,
            message: `All group members must follow each other. User ${i + 1} and ${j + 1} are not mutual.`,
          });
        }
      }
    }

    const groupChat = await Chat.create({
      name,
      groupChat: true,
      creator: creatorId,
      members: allMembers,
    });

    res.status(201).json({
      success: true,
      message: "Group chat created successfully.",
      groupChat,
    });
  } catch (error) {
    console.error("Error creating group chat:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Get all chats for a user
 */
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.userId })
      .populate("members", "name username avatar")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, chats });
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
