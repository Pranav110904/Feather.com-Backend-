import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});

/**
 * Uploads a PDF file buffer to Cloudinary (as a raw file).
 * @param {Buffer} buffer - The PDF file buffer.
 * @param {string} folder - Optional Cloudinary folder name.
 * @returns {Promise<object>} - Cloudinary upload response.
 */
const uploadPdfToCloudinary = async (buffer, folder = "pdf_uploads") => {
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder,
          format: "pdf",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      // pipe buffer to stream
      uploadStream.end(buffer);
    });

    return result;
  } catch (error) {
    console.error("Cloudinary PDF upload error:", error);
    throw new Error("Failed to upload PDF to Cloudinary");
  }
};

export default uploadPdfToCloudinary;
