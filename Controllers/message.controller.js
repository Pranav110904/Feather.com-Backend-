import { Message } from "../Models/message.model.js";
import { Chat } from "../Models/chat.model.js";

export const sendMessage = async (req, res) => {
  const { chatId, content } = req.body;
  const sender = req.userId;

  const newMessage = await Message.create({
    sender,
    chat: chatId,
    content,
  });

  await Chat.findByIdAndUpdate(chatId, { updatedAt: Date.now() });

  const fullMessage = await newMessage.populate("sender", "name email");

  res.status(201).json(fullMessage);
};

export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  const messages = await Message.find({ chat: chatId })
    .populate("sender", "name email")
    .sort({ createdAt: 1 });
  res.status(200).json(messages);
};
