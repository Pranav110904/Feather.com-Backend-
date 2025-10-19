import { v2 as cloudinary } from "cloudinary";

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});

/**
 * 🧹 Delete files from Cloudinary by public IDs
 * @param {Array<string>} publicIds
 */
export const deletFilesFromCloudinary = async (publicIds = []) => {
  try {
    if (!publicIds.length) return;

    await Promise.all(
      publicIds.map(async (id) => {
        await cloudinary.uploader.destroy(id, { resource_type: "auto" });
      })
    );

    console.log("✅ Files deleted successfully from Cloudinary");
  } catch (error) {
    console.error("❌ Error deleting files from Cloudinary:", error);
  }
};

/**
 * 🔔 Emit socket event safely
 * @param {object} req - Express request object (with io in app.locals)
 * @param {string} event - Event name to emit
 * @param {string} roomId - Room or chat ID
 * @param {object} payload - Data to send with event
 */
export const emitEvent = (req, event, roomId, payload) => {
  try {
    const io = req.app.get("io");
    if (!io) {
      console.error("❌ Socket.io instance not found in app.locals");
      return;
    }

    io.to(roomId).emit(event, payload);
    console.log(`📢 Event '${event}' emitted to room '${roomId}'`);
  } catch (error) {
    console.error("❌ Error emitting socket event:", error);
  }
};
