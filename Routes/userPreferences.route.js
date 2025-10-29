import { Router } from 'express';
import { updatePreferences } from "../Controllers/userPreferences.controller.js";
import upload from "../Middleware/Multer.js"; 

const userPreferneceRouter = Router();

userPreferneceRouter.put('/preferences', upload.fields([
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'musicWallpaper', maxCount: 1 }
]), updatePreferences);


export default userPreferneceRouter;