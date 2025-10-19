import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});

/**
 * Uploads a video buffer to Cloudinary
 * @param {Buffer} buffer - The video file buffer
 * @param {string} folder - Optional folder name in Cloudinary
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadVideoCloudinary = async (buffer, folder = "Feather") => {
  if (!buffer) throw new Error("No video buffer provided");

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder : 'Feather', resource_type: "video" }, // specifically video
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

export default uploadVideoCloudinary;
