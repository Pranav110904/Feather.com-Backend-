import mongoose from 'mongoose';


const userSchema = new mongoose.Schema(
  {
    // 🔹 Basic Details
    name: {
      type: String,
      required: [true, "Please provide your full name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [false, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    dob: {
      type: Date,
      required: [true, "Please provide your date of birth"],
    },

    // 🔹 Profile & Personalization
    username: {
      type: String,
      unique: true,
      sparse: true, // allows null until user sets username
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 160,
      default: "",
    },
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    language: {
      type: String,
      default: "English",
    },

    // 🔹 Authentication & Verification
    refresh_token: {
      type: String,
      default: "",
    },
    verify_email: {
      type: Boolean,
      default: false,
    },
    last_login_date: {
      type: Date,
      default: Date.now,
    },
    create_password_otp: {
      type: String,
      default: null,
    },
    password_expiry: {
      type: Date,
      default: null,
    },
    forgot_password_otp: {
      type: String,
      default: null,
    },
    forgot_password_expiry: {
      type: Date,
      default: null,
    },


    // 🔹 Account Status & Roles
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    role: {
      type: String,
      enum: ["User", "Admin"],
      default: "User",
    },

    // 🔹 Relations (for scalability)
    follows: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // future expansion examples
    stories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story",
      },
    ],
    themes: {
      backgroundColor: { type: String, default: "#ffffff" },
      accentColor: { type: String, default: "#1DA1F2" },
    },
  },
  { timestamps: true }
);


const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;