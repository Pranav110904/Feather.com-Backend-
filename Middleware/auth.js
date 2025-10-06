import jwt from "jsonwebtoken";
import User from "../Models/user.model.js";
import  generateAccessToken  from "../Utils/generateAccessToken.js"
import generateRefreshToken  from "../Utils/generateRefreshToken.js";

const auth = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // 🔹 Step 1: Check Access Token
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.SECRET_KEY_ACCESS_TOKEN);
        req.userId = decoded.id;
        return next();
      } catch (err) {
        // If expired, we'll check refresh below
        if (err.name !== "TokenExpiredError") {
          return res.status(401).json({ message: "Invalid access token", success: false });
        }
      }
    }

    // 🔹 Step 2: Access token missing or expired → check Refresh Token
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token found", success: false });
    }

    // Verify Refresh Token
    const decodedRefresh = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
    const user = await User.findById(decodedRefresh.id);

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token", success: false });
    }

    // 🔹 Step 3: Generate new tokens
    // Step 3: Generate new tokens
    const newAccessToken = await generateAccessToken(user._id);
    const newRefreshToken = await generateRefreshToken(user._id);
    
    user.refresh_token = newRefreshToken; // now a string
    await user.save();


    // Set cookies again
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 5 * 60 * 60 * 1000, // 5 hours
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Attach user ID to request and move forward
    req.userId = user._id;
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({
      message: "Unauthorized",
      success: false,
    });
  }
};


export default auth;