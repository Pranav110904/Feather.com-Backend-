import  Message  from "../Models/message.model.js";
import  Chat  from "../Models/chat.model.js";
import uploadImageCloudinary from "../Utils/uploadImageToCloudinary.js";
import uploadVideoCloudinary from "../Utils/uploadVideoCloudinary.js";
import uploadPdfToCloudinary from "../Utils/uploadPdfToCloudinary.js";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { PDFDocument } from "pdf-lib";
import { Readable } from "stream";

// Helper to convert buffer to readable stream (for ffmpeg)
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const sender = req.userId;
    const file = req.file; // from multer single('attachment')

    // ✅ Either text or attachment must be present
    if (!content && !file) {
      return res.status(400).json({ message: "Message content or attachment required." });
    }

    let attachments = [];

    // ✅ Handle attachments if provided
    if (file) {
      const mimeType = file.mimetype;
      const sizeInMB = file.size / (1024 * 1024);
      const maxSizeMB = 25; // limit to 25 MB
      if (sizeInMB > maxSizeMB) {
        return res.status(400).json({ message: `File size exceeds ${maxSizeMB} MB limit.` });
      }

      // 🖼️ IMAGE
      if (mimeType.startsWith("image/")) {
        const compressedBuffer = await sharp(file.buffer)
          .resize({ width: 1200 })
          .jpeg({ quality: 75 })
          .toBuffer();

        const uploaded = await uploadImageCloudinary({ buffer: compressedBuffer });
        attachments.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
          type: "image",
        });
      }

      // 🎥 VIDEO
      else if (mimeType.startsWith("video/")) {
        const compressedBuffer = await new Promise((resolve, reject) => {
          const inputStream = bufferToStream(file.buffer);
          const chunks = [];

          ffmpeg(inputStream)
            .videoCodec("libx264")
            .audioCodec("aac")
            .size("?x720") // 720p
            .format("mp4")
            .on("error", reject)
            .on("end", () => resolve(Buffer.concat(chunks)))
            .pipe()
            .on("data", (chunk) => chunks.push(chunk));
        });

        const uploaded = await uploadVideoCloudinary(compressedBuffer);
        attachments.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
          type: "video",
        });
      }

      // 📄 PDF
      else if (mimeType === "application/pdf") {
        const pdfDoc = await PDFDocument.load(file.buffer);
        const compressedPdf = await pdfDoc.save({ useObjectStreams: false }); // lightweight optimization

        const uploaded = await uploadPdfToCloudinary(compressedPdf);
        attachments.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
          type: "pdf",
        });
      }

      // ❌ Unsupported file
      else {
        return res.status(400).json({ message: "Unsupported file type. Only image, video, or PDF allowed." });
      }
    }

    // ✅ Create new message
    const newMessage = await Message.create({
      sender,
      chat: chatId,
      content,
      attachments,
    });

    // Update chat's last activity
    await Chat.findByIdAndUpdate(chatId, { updatedAt: Date.now() });

    // Populate sender for frontend
    const fullMessage = await newMessage.populate("sender", "name username avatar");

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: fullMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  const messages = await Message.find({ chat: chatId })
    .populate("sender", "name email")
    .sort({ createdAt: 1 });
  res.status(200).json(messages);
};