import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // links story to user
      required: true,
      index: true,
    },

    mediaUrl: {
      type: String,
      required: true, // Cloudinary full media URL
    },

    thumbnailUrl: {
      type: String,
      required: true, // Cloudinary thumbnail URL for feed
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isArchived: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // auto-delete after expiry
    },
  },
  {
    timestamps: true,
  }
);

// Set default expiry to 24h from creation if not provided
storySchema.pre("validate", function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

// Index for fast feed query: active stories of following users
storySchema.index({ user: 1, expiresAt: 1, isArchived: 1 });

const Story = mongoose.model("Story", storySchema);
export default Story;
