import mongoose from "mongoose";
import Follow from "../Models/follow.modal.js";
import User from "../Models/user.model.js";

// 🔹 Follow a user
export const followUser = async (req, res) => {
  try {
    const followerId = req.userId; // Authenticated user
    const { followingId } = req.params; // User to follow

    // Validate following ID
    if (!mongoose.Types.ObjectId.isValid(followingId)) {
      return res.status(400).json({ message: "Invalid user ID to follow" });
    }

    // Prevent self-follow
    if (followerId.toString() === followingId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({ follower: followerId, following: followingId });
    if (existingFollow) {
      return res.status(400).json({ message: "You are already following this user" });
    }

    // Create follow record
    const follow = new Follow({ follower: followerId, following: followingId });
    await follow.save();

    // Update counts atomically
    await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });

    res.status(200).json({ message: "Followed successfully", follow });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// 🔹 Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.userId; // Authenticated user
    const { followingId } = req.params; // User to unfollow

    // Validate following ID
    if (!mongoose.Types.ObjectId.isValid(followingId)) {
      return res.status(400).json({ message: "Invalid user ID to unfollow" });
    }

    // Find and delete the follow record
    const follow = await Follow.findOneAndDelete({ follower: followerId, following: followingId });
    if (!follow) {
      return res.status(400).json({ message: "You are not following this user" });
    }

    // Update counts atomically
    await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// 🔹 Get followers of a user
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const followers = await Follow.find({ following: userId }).populate('follower', 'name username avatar');
    res.status(200).json(followers.map(f => f.follower));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// 🔹 Get users a user is following
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const following = await Follow.find({ follower: userId }).populate('following', 'name username avatar');
    res.status(200).json(following.map(f => f.following));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
