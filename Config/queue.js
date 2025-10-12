import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import Story from "../Models/story.model.js";
import cloudinary from "cloudinary";


// Redis connection
const connection = new IORedis({
  host: "localhost",
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
}); 

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});

// Queue for story cleanup
export const storyQueue = new Queue("storyQueue", { connection });

// Worker to process deletion
export const storyWorker = new Worker(
  "storyQueue",
  async job => {
    const { storyId, mediaPublicId, thumbPublicId, mediaType } = job.data; // <-- include mediaType

    // Delete from Cloudinary
    try {
      if (mediaPublicId) {
        await cloudinary.v2.uploader.destroy(mediaPublicId, {
          resource_type: mediaType === "video" ? "video" : "image" // now defined correctly
        });
      }

      if (thumbPublicId) {
        await cloudinary.v2.uploader.destroy(thumbPublicId, { resource_type: "image" });
      }
    } catch (err) {
      console.error("❌ Cloudinary deletion error:", err);
    }

    // Delete from MongoDB
    try {
      await Story.findByIdAndDelete(storyId);
      console.log(`✅ Deleted story ${storyId} from DB & Cloudinary`);
    } catch (err) {
      console.error("❌ MongoDB deletion error:", err);
    }
  },
  { connection }
);


storyWorker.on("completed", job => console.log(`✅ Job ${job.id} completed`));
storyWorker.on("failed", (job, err) => console.error(`❌ Job ${job.id} failed`, err));
