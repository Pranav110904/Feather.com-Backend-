import User from "../Models/user.model.js";
import sendEmail from "../Config/resend.js";
// import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import bcrypt from "bcryptjs";
import generateAccessToken from "../Utils/generateAccessToken.js";
import generateRefreshToken from "../Utils/generateRefreshToken.js";
// import { response } from "express";
import uploadImageCloudinary from "../Utils/uploadImageToCloudinary.js";
import generatedOtp from "../Utils/generateOtp.js";
import otpTemplate from "../Utils/otpTemplate.js";
import Category from '../Models/category.model.js';
import passwordResetOtpTemplate from "../Utils/passwordResetOtpTemplate.js";

// so this is the user controller basicaly i have extracted from the my previous project
// so  lets start creating this

//Users Arrival Over the Pagee
export const registerUserController = async (req, res) => {
  try {
    const { name, email, dob } = req.body;

    if (!name || !email || !dob)
      return res.status(400).json({
        message: "All fields are required",
        error: true,
        success: false,
      });

    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(400).json({
        message: "User With this Email already exists",
        error: true,
        success: false,
      });

    // Generate OTP for email verification

    const create_password_otp = generatedOtp(); // 6-char OTP
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    const user = await User.create({
      name,
      email,
      dob,
      create_password_otp,
      password_otp_expiry: otpExpiry,
    });

    // Send OTP via email
    await sendEmail({
      reciver: user.email,
      subject: "Verify your email",
      html: otpTemplate({ name: user.name, otp: create_password_otp }),
    });


    res.status(201).json({
      message: "OTP sent to your email. Please verify to continue.",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: true,
      success: false,
    });
  }
};

// Now the email Should be verified
// Verification of email

export const verifyOtpByEmailController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) 
      return res.status(400).json({ 
        message: "email and otp required", 
        success: false 
      });

    const user = await User.findOne({ email }).select("create_password_otp password_otp_expiry verify_email");
    if (!user) 
      return res.status(404).json({ 
        message: "User not found", 
        success: false,
        error: true
      });

    if (user.verify_email) 
      return res.status(400).json({ 
        message: "Email already verified", 
        success: false,
        error: true
      });

    if (!user.create_password_otp || !user.password_otp_expiry)
      return res.status(400).json({
        message: "No OTP found, request a new one", 
        success: false,
        error: true
      });

    if (new Date() > new Date(user.password_otp_expiry))  
      return res.status(400).json({ 
        message: "OTP expired", 
        success: false,
        error: true
      });

    if (String(user.create_password_otp) !== String(otp).trim()) 
      return res.status(400).json({
        message: "Invalid OTP", 
        success: false,
        error: true
      });

    user.verify_email = true;
    user.create_password_otp = null;
    user.password_otp_expiry = null;
    await user.save();

    return res.status(200).json({ 
      message: "OTP verified", 
      success: true, 
      userId: user._id 
    });
    
    
  } catch (err) {
    console.error("verifyOtpByEmailController error:", err);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

//Now create the password and add the refresh token and access token
export const createPasswordController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        success: false,
      });
    }


    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    
  

 
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.status = "Active"; // update status to Active
    await user.save();

    const accessToken = await generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

  
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only HTTPS in prod
      sameSite: "strict",
      maxAge: 5 * 60 * 60 * 1000, // 5 hours
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    
    return res.status(200).json({
      message: "Password created successfully and tokens generated.",
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error in createPasswordController:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

//Uploading the image over cloudinary and then uplading that over the database
export const updateProfilePictureController = async (req, res) => {
  try {
    // Multer adds file to req.file
    const image = req.file;
    const userId = req.userId; // from auth middleware

    if (!image) {
      return res.status(400).json({
        message: "Please upload an image",
        error: true,
        success: false,
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImageCloudinary(image);

    if (!uploadResult || !uploadResult.secure_url) {
      return res.status(500).json({
        message: "Failed to upload image",
        error: true,
        success: false,
      });
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: uploadResult.secure_url },
      { new: true }
    ).select("-password -refresh_token");

    res.status(200).json({
      message: "Profile picture updated successfully",
      data: updatedUser,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false,
    });
  }
};

//Language Selection Controller
export async function languageSelectController(req,res)
  {
    try{
      const {language} = req.body;
      const userId = req.userId;

      if(!language){
        return res.status(400).json({
          message: "Language is required",
          error: true,
          success: false,
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { language },
        { new: true }
      ).select("-password ");

      res.status(200).json({
        message: "Language updated successfully",
        data: updatedUser,
        success: true,
        error: false,
      });
      
    }catch(error){
      console.error("Error updating language:", error);
      res.status(500).json({
        message: error.message || "Internal server error",
        error: true,
        success: false,
      });
    }
  }
  
//creating the route for ADD USERNAME
  
export const addUsernameController = async (req, res) => {
      try {
          const { username } = req.body;
  
          if (!username) {
              return res.status(400).json({
                  message: "Username is required",
                  error: true,
                  success: false
              });
          }
  
          // Check if the username already exists
          const existingUser = await User.findOne({ username });
          if (existingUser) {
              return res.status(409).json({
                  message: "Username already taken",
                  error: true,
                  success: false
              });
          }
  
          // Update the username for the logged-in user
          const updatedUser = await User.findByIdAndUpdate(
              req.userId, // comes from auth middleware
              { username },
              { new: true } // returns the updated document
          );
  
          if (!updatedUser) {
              return res.status(404).json({
                  message: "User not found",
                  error: true,
                  success: false
              });
          }
  
          res.status(200).json({
              message: "Username updated successfully",
              success: true,
              error: false,
              data: {
                  id: updatedUser._id,
                  username: updatedUser.username
              }
          });
      } catch (error) {
          res.status(500).json({
              message: error.message || "Something went wrong",
              error: true,
              success: false
          });
      }
  };

//Category Selection Controller
export async function createCategorySelectionController(req, res) {
    try {
        const { names } = req.body; // expecting an array of category names
        const userId = req.userId; // from auth middleware

        if (!names || !Array.isArray(names) || names.length === 0) {
            return res.status(400).json({
                message: "Names array is required",
                error: true,
                success: false,
            });
        }

        // Remove duplicates in input
        const uniqueNames = [...new Set(names)];

        // Find existing categories
        const existingCategories = await Category.find({
            name: { $in: uniqueNames }
        });

        const existingNames = existingCategories.map(cat => cat.name);

        // Categories that need to be created
        const newNames = uniqueNames.filter(name => !existingNames.includes(name));

        // Insert new categories if any
        const newCategories = newNames.length
            ? await Category.insertMany(newNames.map(name => ({ name })))
            : [];

        // Combine all categories (existing + new)
        const allCategories = [...existingCategories, ...newCategories];

        // Get ObjectIds
        const categoryIds = allCategories.map(cat => cat._id);

        // Update the authenticated user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { categories: { $each: categoryIds } } }, // add only if not already present
            { new: true }
        ).populate('categories');

        res.status(200).json({
            message: "Categories added to user successfully",
            data: updatedUser,
            success: true,
            error: false,
        });

    } catch (error) {
        console.error("Error updating categories:", error);
        res.status(500).json({
            message: error.message || "Internal server error",
            error: true,
            success: false,
        });
    }
}


//Login Controller 
export async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    // 🔹 Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
        error: true,
        success: false,
      });
    }

    // 🔹 Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    // 🔹 Check if account is active
    if (user.status !== "Active") {
      return res.status(400).json({
        message: "Your account is not active",
        error: true,
        success: false,
      });
    }

    // 🔹 Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
        error: true,
        success: false,
      });
    }

    // 🔹 Generate tokens
    const accessToken = await generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    // 🔹 Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true only in prod
      sameSite: "None",
    };

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    // 🔹 Send response
    return res.status(200).json({
      message: "Login successful",
      error: false,
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false,
    });
  }
}


//user logout Controller
export async function logoutController(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
        error: true,
        success: false,
      });
    }

    // 🔹 Clear cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    // 🔹 Remove stored refresh token in DB
    await User.findByIdAndUpdate(userId, { refresh_token: "" });

    return res.status(200).json({
      message: "Logout successful",
      error: false,
      success: true,
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false,
    });
  }
}


//forgot password
export async function forgotPasswordController(req,res){
  try{  
    
    const { email } = req.body;
    
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(404).json({
            message: "User not found",
            error:true,
            success: false,
          });
        }
    
        // Generate OTP
        const otp = generatedOtp();
    
        user.forgot_password_otp = otp;
        user.forgot_password_expiry = Date.now() + 5 * 60 * 1000; // expires in 5 mins
        await user.save();
    
        // Send OTP to email
        await sendEmail({
          reciver:email,
          subject: "Password Reset OTP",
          html: passwordResetOtpTemplate({name:user.username,otp:otp})
        });
    
        return res.status(200).json({
          message: "OTP sent successfully",
          success: true,
        });
    
    
  }catch(error){
    return res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false,
    });
  }
}


//verify the reset password otp 
export const verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    if (
      user.forgot_password_otp !== otp ||
      user.forgot_password_expiry < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
        error: true,
        success: false,
      });
    }

    // ✅ OTP verified successfully — clear OTP fields
    user.forgot_password_otp = null;
    user.forgot_password_expiry = null;
    user.isOtpVerified = true;
    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};


//reseting the Password
export const resetPasswordController = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // 1️⃣ Validate input
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Email, password, and confirm password are required",
        success: false,
      });
    }

    // 2️⃣ Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
        success: false,
      });
    }

    // 3️⃣ Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // 4️⃣ Check if OTP was verified first
    if (!user.isOtpVerified) {
      return res.status(400).json({
        message: "OTP not verified. Please verify before resetting password.",
        success: false,
      });
    }

    // 5️⃣ Hash new password and clear verification flag
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.isOtpVerified = false; // reset verification flag
    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};


//update user controller
export const updateUserController = async (req, res) => {
  try {
    const userId = req.userId; // from auth middleware
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const { name, username, dob, bio, language, categories } = req.body;

    const updateFields = {
      ...(name && { name }),
      ...(username && { username }),
      ...(dob && { dob }),
      ...(bio && { bio }),
      ...(language && { language }),
    };

    // 🔹 Handle avatar upload if file is provided
    if (req.file) {
      const uploadResult = await uploadImageCloudinary(req.file);
      if (!uploadResult || !uploadResult.secure_url) {
        return res.status(500).json({
          message: "Failed to upload avatar",
          success: false,
        });
      }
      updateFields.avatar = uploadResult.secure_url;
    }

    // 🔹 Handle categories: merge new categories if provided
    if (categories && Array.isArray(categories)) {
      const user = await User.findById(userId);
      const mergedCategories = [...new Set([...(user.categories || []), ...categories])];
      updateFields.categories = mergedCategories;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
        success: false,
      });
    }

    // 🔹 Update user in DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password -refresh_token -forgot_password_otp -forgot_password_expiry");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};





