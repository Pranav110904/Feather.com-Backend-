 import { Router } from "express"
// import { updateUserDetails, userRegistrationControler,forgotPasswordController,verifyOtpController ,resetPasswordController, refreshTokenController } from "../controllers/user.controller.js"
// import {verifyEmail} from "../controllers/user.controller.js"
// import { LoginController } from "../controllers/user.controller.js"
// import { logoutController } from "../controllers/user.controller.js"
// import  auth  from "../Middleware/auth.js"
// import upload from "../Middleware/multer.js"
// import { uploadAvatar } from "../controllers/user.controller.js"

import { 
  registerUserController,
  verifyOtpByEmailController } from "../Controllers/user.controller.js"
const userRouter=Router()


userRouter.post('/register',registerUserController)
userRouter.post('/verify',verifyOtpByEmailController)
// userRouter.post('/register',userRegistrationControler)
// userRouter.post('/verify-email',verifyEmail)
// userRouter.post('/login',LoginController)
// userRouter.get('/logout',auth,logoutController)
// userRouter.put('/upload-avatar',auth,upload.single('avatar'),uploadAvatar) 

// userRouter.put('/update-user',auth,updateUserDetails)
// userRouter.put('/forgot-password',forgotPasswordController)
// userRouter.put('/verify-forgotpassword-otp',verifyOtpController)
// userRouter.put('/reset-password',resetPasswordController)
// userRouter.post('/refresh-token',refreshTokenController)
export default userRouter;
