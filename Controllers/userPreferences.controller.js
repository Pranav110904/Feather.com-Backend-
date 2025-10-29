import UserPreferences from "../Models/userPreferences.model.js";
import uploadImageCloudinary from "../Utils/uploadImageToCloudinary.js"; // the helper you gave
import mongoose from "mongoose";

// If using multer, middleware would look like: upload.fields([...])

export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id || req.body.userId; // get user ID from auth middleware or body
    if (!userId) return res.status(400).json({ message: "User ID required" });

    // Find preferences or create if none
    let preferences = await UserPreferences.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!preferences) {
      preferences = new UserPreferences({ user: userId });
    }

    // Handle fields – only update if provided
    // 1. Background Image
    if (req.files && req.files.backgroundImage) {
      // multer stores file in req.files
      const bgImgFile = req.files.backgroundImage[0];
      const bgImgResult = await uploadImageCloudinary(bgImgFile);
      preferences.backgroundImage = bgImgResult.secure_url; // or url
    }
    // 2. Mood (wallpaper is NOT user-upload—just assign value)
    if (req.body.mood) {
      const allowedMoods = ["Happy", "Sad", "Calm", "Angry", "Energetic", "Anxious"];
      if (allowedMoods.includes(req.body.mood)) {
        preferences.mood = req.body.mood;
        // set wallpaper URL by mood (predefined)
        const moodWallpapers = {
          Happy: "URL_FOR_HAPPY",
          Sad: "URL_FOR_SAD",
          Calm: "URL_FOR_CALM",
          Angry: "URL_FOR_ANGRY",
          Energetic: "URL_FOR_ENERGETIC",
          Anxious: "URL_FOR_ANXIOUS"
        };
        preferences.moodWallpaper = moodWallpapers[req.body.mood];
      }
    }
    // 3. Music Wallpaper (user-upload: Cloudinary)
    if (req.files && req.files.musicWallpaper) {
      const musicWpFile = req.files.musicWallpaper[0];
      const musicWpResult = await uploadImageCloudinary(musicWpFile);
      preferences.musicWallpaper = musicWpResult.secure_url;
    }
    // 4. Text fields (partial updates)
    if (req.body.favoriteSong) preferences.favoriteSong = req.body.favoriteSong;
    if (req.body.musician) preferences.musician = req.body.musician;
    if (req.body.spotifyLink) preferences.spotifyLink = req.body.spotifyLink;
    if (req.body.followButtonColor) preferences.followButtonColor = req.body.followButtonColor;

    // Save changes
    await preferences.save();

    res.status(200).json({ 
      message: "Preferences updated successfully", 
      preferences 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating preferences", error: error.message });
  }
};
