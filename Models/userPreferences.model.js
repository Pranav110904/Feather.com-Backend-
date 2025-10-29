import mongoose from "mongoose";

const userPreferencesSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      unique: true 
    }, // One-to-one relationship: each preferences doc belongs to one user

    // Profile Customization
    backgroundImage: { type: String, default: "" }, // User-chosen background image

    // Mood Selection and Wallpaper
    mood: { 
      type: String, 
      enum: ["Happy", "Sad", "Calm", "Angry", "Energetic", "Anxious"], 
      default: "Happy" 
    },
    moodWallpaper: { type: String, default: "" }, // URL or local identifier for selected mood image

    // Music Player Preferences
    favoriteSong: { type: String, default: "" }, // Song name or YouTube/Spotify link
    musician: { type: String, default: "" },
    spotifyLink: { type: String, default: "" }, // Playlist or music link
    musicWallpaper: { type: String, default: "" }, // User-chosen wallpaper/image for music player
    followButtonColor: { type: String, default: "" }, // Color for follow button

    // Extend here as you add new personalization features!
  },
  { timestamps: true }
);

const UserPreferences = mongoose.models.UserPreferences || mongoose.model("UserPreferences", userPreferencesSchema);
export default UserPreferences;
