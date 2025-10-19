// Utils/feature.js
import cloudinary from "cloudinary";

// ✅ Delete files from Cloudinary
export const deletFilesFromCloudinary = async (public_ids = []) => {
  try {
    if (!public_ids.length) return;
    const deletePromises = public_ids.map(id =>
      cloudinary.v2.uploader.destroy(id)
    );
    await Promise.all(deletePromises);
    console.log("🗑️ Deleted files from Cloudinary:", public_ids);
  } catch (error) {
    console.error("Error deleting files from Cloudinary:", error);
  }
};

// ✅ Emit socket event to multiple users
export const emitEvent = (req, event, users = [], data) => {
  try {
    const io = req.app.get("io"); // get the socket instance from Express
    if (!io) return console.warn("⚠️ Socket.IO not initialized yet");
    users.forEach(userId => {
      io.to(userId.toString()).emit(event, data);
    });
  } catch (error) {
    console.error("Error emitting socket event:", error);
  }
};
