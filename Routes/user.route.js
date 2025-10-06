 import { Router } from "express"
// import { updateUserDetails, userRegistrationControler,forgotPasswordController,verifyOtpController ,resetPasswordController, refreshTokenController } from "../controllers/user.controller.js"
// import {verifyEmail} from "../controllers/user.controller.js"
// import { LoginController } from "../controllers/user.controller.js"
// import { logoutController } from "../controllers/user.controller.js"
import  auth  from "../Middleware/auth.js"
import upload from "../Middleware/Multer.js"
// import { uploadAvatar } from "../controllers/user.controller.js"

import { 
  registerUserController,
  verifyOtpByEmailController,
  createPasswordController,
  updateProfilePictureController,
  languageSelectController,
  addUsernameController,
  createCategorySelectionController,
  loginController,
  logoutController
} from "../Controllers/user.controller.js"
const userRouter=Router()


userRouter.post('/register',registerUserController)
userRouter.post('/verify-Email',verifyOtpByEmailController)
userRouter.post('/login',loginController)
userRouter.post('/create-password',createPasswordController)
userRouter.put('/profile-pic',auth,upload.single('profile-pic'),updateProfilePictureController)
userRouter.post('/language-selection',auth,languageSelectController)
userRouter.post('/add-username', auth, addUsernameController);
userRouter.post('/add-categories', auth, createCategorySelectionController);
userRouter.get('/logout',auth,logoutController)






// userRouter.put('/update-user',auth,updateUserDetails)
// userRouter.put('/forgot-password',forgotPasswordController)
// userRouter.put('/verify-forgotpassword-otp',verifyOtpController)
// userRouter.put('/reset-password',resetPasswordController)
// userRouter.post('/refresh-token',refreshTokenController)
export default userRouter;
