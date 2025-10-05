import User from "../Models/user.model.js";
import sendEmail from "../Config/resend.js";
// import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import bcryptjs from "bcryptjs";
 import generateAccessToken from "../Utils/generateAccessToken.js";
 import generateRefreshToken from "../Utils/generateRefreshToken.js";
// import { response } from "express";
// import upload from "../Middleware/multer.js";
// import uploadImageCloudinary from "../utils/uploadImageCloudinary.js";

import generatedOtp from "../Utils/generateOtp.js";
import otpTemplate from "../Utils/otpTemplate.js";
import jwt from "jsonwebtoken";

// so this is the user controller basicaaly i have extracted from the my previous project
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
        message: "Email already exists",
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
      password_expiry: otpExpiry,
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

    const user = await User.findOne({ email }).select("create_password_otp password_expiry verify_email");
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

    if (!user.create_password_otp || !user.password_expiry)
      return res.status(400).json({
        message: "No OTP found, request a new one", 
        success: false,
        error: true
      });

    if (new Date() > new Date(user.password_expiry))  
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
    user.password_expiry = null;
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


//Now create the password
 
export const createPasswordController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        success: false,
      });
    }

    // 2️⃣ Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    // 4️⃣ Generate tokens
    const accessToken = await generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    // 5️⃣ Set cookies (secure, HTTP-only)
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

    // 6️⃣ Success response
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


//user registration
// export async function userRegistrationControler(req,res){

//         try{

//             const {name ,email,dob}= req.body;

//             if(!name || !email || !dob){
//                 return res.status(400).json(
//                     {
//                         message: "All fields are required",
//                         error: true,
//                         success: false
//                     }
//                 )
//             }

//             const user = await UserModel.findOne({email});
//             if(user){
//                 return res.json(
//                     {
//                         message: " user Already Exsits",
//                         error: true,
//                         success: false
//                     }
//                 )
//             }

//             const salt = await bcryptjs.genSalt(10);
//             const hashedPassword = await bcryptjs.hash(password, salt);

//             const payload = {
//                 name,
//                 email,
//                 password: hashedPassword
//             }

//             const newUser = new UserModel(payload)
//             const save = await newUser.save();

//             const verifyEmailUrl=`${process.env.FRONTEND_URL}/verify-email?code=${save._id}`;
//             const nameForEmail=payload.name;

//             const verifyemail = await sendEmail({
//                 reciver: email,
//                 subject: "Verify Email",
//                 html :  verifyEmailTemplate({
//                    name : nameForEmail,
//                    url :  verifyEmailUrl
//             })
//             })

//             return res.status(200).json({
//                 message:  "User Registered Successfully",
//                 error: false,
//                 success: true,
//                 data: save
//             }
//             )

//         }catch(error){
//             return res.status(500).json(
//                 {
//                     message: error.message || error,
//                     error: true,
//                     success: false
//                 }
//             )
//         }
// }

//verify email
// export async function verifyEmail(req,res){
//     try{

//         const {code_id}=req.body;
//         console.log(code_id);

//         const user = await UserModel.findOne({_id : code_id});
//         if(!user){
//             return res.status(404).json({
//                 message: "User Not Found",
//                 error: true,
//                 success: false
//             })
//         }

//         const updateUser = await UserModel.updateOne({_id:code_id},{verify_email : true})

//         return res.status(200).json(
//             {
//                 message: "Email Verified Successfully",
//                 error: false,
//                 success: true,
//                 data: updateUser
//             }
//         )
//     }
//     catch(error){
//         return res.status(500).json({
//             message: error.message || error,
//             error: true,
//             success: false
//         })
//     }
// }

// //user login
// export async function LoginController(req,res){
//     try{

//         const {email,password}= req.body;
//         if(!email || !password)
//         {
//             res.status(400).json({
//                 message : "All fields are required",
//                 error : true,
//                 success : false
//             })
//         }

//         const user = await UserModel.findOne({email});

//         if(!user) {
//             return res.status(404).json({
//                 message: "User Not Found",
//                 error: true,
//                 success: false
//             })
//         }

//         if(user.status!=="Active"){
//             res.status(400).json({
//                 message: "Your account is not active",
//                 error: true,
//                 success: false
//             })
//         }

//         const isMatch = await bcryptjs.compare(password,user.password);

//         if(!isMatch){
//             return res.status(400).json({
//                 message: "Invalid Credentials",
//                 error: true,
//                 success: false
//             })
//         }

//         const accessToken= await generateAccessToken(user._id);
//         const refreshToken = await generateRefreshToken(user._id);

//         const cookieOptions = {
//             httpOnly: true,
//             secure: true,
//             sameSite: 'None',
//         }

//         res.cookie('refreshToken',refreshToken,cookieOptions)
//         res.cookie('accessToken',accessToken,cookieOptions)

//         return res.status(200).json({
//             message: "Login Successfull",
//             error: false,
//             success: true,
//             data: {
//                 accessToken,
//                 refreshToken
//             }
//         })

//     }
//     catch(error){
//         res.status(500).json({
//             message: error.message || error,
//             error: true,
//             success: false
//         })
//     }
// }

// //user logout
// export async function logoutController(req,res){
//     try{

//         const userId = req.userId;
//         const cookieOptions = {
//             httpOnly: true,
//             secure: true,
//             sameSite: 'None',
//         }
//         res.clearCookie('refreshToken',cookieOptions);
//         res.clearCookie('accessToken',cookieOptions);

//         const updateRefreshToken = await UserModel.findByIdAndUpdate({_id: userId}, {refresh_token : ""})

//         return res.status(200).json({
//             message: "Logout Successfull",
//             error: false,
//             success: true,
//         })

//     }
//     catch(error){
//         res.status(500).json({

//             message: error.message || error,
//             error: true,
//             success: false,

//         })
//     }
// }

// //user Avatar
// export  async function uploadAvatar(req,res){

//     try {
//         const userId = req.userId;
//         const image = req.file;

//         const upload = await uploadImageCloudinary(image);

//         const updateAvatar = await UserModel.findByIdAndUpdate({_id: userId}, {avatar : upload.secure_url})

//         return res.status(200).json({
//             message: "Avatar Uploaded Successfully",
//             error: false,
//             success: true,
//             data: upload
//         })
//     }
//     catch(error){
//         return res.status(500).json({
//             message: error.message || error,
//             error: true,
//             success: false,
//         })
//     }
// }

// //user detail updation
// export async function updateUserDetails(req,res) {

//     try{
//         const userId = req.userId;
//         const {name,email,mobile,password} = req.body;
//         let hashPassword = "";
//         if(password)
//         {
//             const salt = await bcryptjs.genSalt(10);
//              hashPassword = await bcryptjs.hash(password, salt);
//         }

//         const updateUser= await UserModel.updateOne({_id:userId},{
//             ...name && {name : name},
//             ...email && {email : email},
//             ...mobile && {mobile : mobile},
//             ...password && {password : hashPassword}
//         })

//         return res.status(200).json({
//             message: "User Details Updated Successfully",
//             error: false,
//             success: true,
//             data: updateUser
//         })

//     }
//     catch(error){
//         return res.status(500).json({
//             message: error.message || error,
//             error: true,
//             success: false,
//         })
//     }
// }

// //forgot password
// export async function forgotPasswordController(req, res) {
//   try {
//     const { email } = req.body;

//     const user = await UserModel.findOne({ email });
//     if (!user) {
//       return res.status(404).json({
//         message: "User Not Found",
//         error: true,
//         success: false
//       });
//     }
//     const otp = generatedOtp();

//     const expireTime = new Date(Date.now() + 60 * 60 * 1000); //
//     const updateUser = await UserModel.findByIdAndUpdate(
//       { _id: user._id },
//       {
//         forgot_password_otp: otp,
//         forgot_password_expiry: expireTime.toISOString()
//       },
//       { new: true }
//     );

//     await sendEmail({
//       reciver: email,
//       subject: "Blinkit - OTP for Password Reset",
//       html: otpTemplate({ name: user.name, otp })
//     });

//     return res.json({
//       message: "OTP Sent Successfully",
//       error: false,
//       success: true,
//       data: {
//         email: user.email,
//         name: user.name
//       }
//     });

//   } catch (error) {
//     return res.status(500).json({
//       message: error.message || "Internal Server Error",
//       error: true,
//       success: false
//     });
//   }
// }

// //verifyOTP
// export async function verifyOtpController(req, res) {
//     try{
//         const {email, otp } = req.body;

//         if(!email || !otp){
//             return res.status(400).json({
//                 message: "Email and OTP are required",
//                 error: true,
//                 success: false
//             })
//         }
//         const user = await UserModel.findOne({email});
//         if(!user){
//             return res.status(404).json({
//                 message: "User Not Found",
//                 error: true,
//                 success: false
//             })
//         }

//         const currTime=new Date();
//         if(user.forgot_password_expiry < currTime){
//             return res.status(400).json({
//                 message: "OTP Expired",
//                 error: true,
//                 success: false
//             })
//         }

//         if(user.forgot_password_otp !== otp){
//             return res.status(400).json({
//                 message: "Invalid OTP",
//                 error: true,
//                 success: false
//             })
//         }

//         return res.status(200).json({
//             message: "OTP Verified Successfully",
//             error: false,
//             success: true,
//             data: user
//         })
//     }
//     catch(error)
//     {
//         return res.status(500).json({
//             message: error.message || error,
//             error: true,
//             success: false
//         })
//     }
// }

// //reset the password
// export async function resetPasswordController(req,res) {
//     try{

//         const {email ,newpassword ,confirmpassword} =req.body;

//         if(!email || !newpassword || !confirmpassword){
//             return res.status(400).json({
//                 message: "Email and Password are required",
//                 error: true,
//                 success: false
//             })
//         }

//         const user = await UserModel.findOne({email});
//         if(!user){
//             return res.status(404).json({
//                 message: "User Not Found",
//                 error: true,
//                 success: false
//             })
//         }

//         if(newpassword !== confirmpassword){
//             return res.status(400).json({
//                 message: "Password and Confirm Password do not match",
//                 error: true,
//                 success: false
//             })
//         }

//         const salt = await bcryptjs.genSalt(10);
//         const hashPassword = await bcryptjs.hash(newpassword, salt);

//         const updateUser = await UserModel.findByIdAndUpdate(
//             { _id: user._id },
//             {
//               password: hashPassword,
//               forgot_password_otp: null,
//               forgot_password_expiry: null
//             },
//             { new: true }
//           );

//         return res.status(200).json({
//             message: "Password Reset Successfully",
//             error: false,
//             success: true,
//             data: updateUser
//         })

//     }
//     catch(error){
//         return res.status(500).json({
//             message: error.message || error,
//             error: true,
//             success: false
//         })
//     }
// }

// //refresh token controller
// export async function refreshTokenController(req,res){

//     try{

//         const refreshToken = req.cookies.refreshToken || request.header?.authorization?.split(" ")[1];

//         if(!refreshToken)
//         {
//             return res.status(401).json({
//                 message: "Unauthorized",
//                 error: true,
//                 success: false
//             })
//         }

//         const verifyToken = await jwt.verify(refreshToken,process.env.SECRET_KEY_REFRESH_TOKEN);

//         if(!verifyToken)
//         {
//             return res.status(401).json({
//                 message: "Unauthorized",
//                 error: true,
//                 success: false
//             })
//         }

//         const newaccessToken= await generateAccessToken(verifyToken?._id)

//         res.cookie("accessToken",newaccessToken,{
//             httpOnly: true,
//             secure: true,
//             sameSite: 'None',
//         })

//         return res.status(200).json({
//             message: "Token Refreshed Successfully",
//             error: false,
//             success: true,
//             data: newaccessToken
//         })
//     }
//     catch(error){

//         return res.status(500).json({
//             message: error.message || error,
//             error: true,
//             success: false
//         })

//     }
// }
