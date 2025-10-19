import mongoose, { Schema, model, Types } from "mongoose";

const schema = new Schema(
  {
    name: { type: String, required: true },
    groupChat: { type: Boolean, default: false },
    creator: { type: Types.ObjectId, ref: "User" },
    members: [{ type: Types.ObjectId, ref: "User" }],

    // Group chat avatar
    avatar: { type: String, default: "" }, // URL of the group avatar
  },
  { timestamps: true }
);

const Chat = mongoose.models.Chat || model("Chat", schema);

export default Chat;