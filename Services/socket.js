// socket/socket.js
import { Server } from "socket.io";
import Message from "../Models/message.model.js";
import Chat from "../Models/chat.model.js";
export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // restrict in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
  
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });
  
    socket.on("send_message", async (data) => {
      const { chatId, senderId, content, attachments } = data;
  
      try {
        const newMessage = await Message.create({
          sender: senderId,     
          content,
          attachments: attachments || [],
        });
  
        await Chat.findByIdAndUpdate(chatId, { updatedAt: Date.now() });
  
        const fullMessage = await newMessage.populate("sender", "name username avatar");
  
        io.to(chatId).emit("receive_message", fullMessage);
      } catch (err) {
        console.error("Socket error:", err);
      }
    });
  });

  return io;
};
