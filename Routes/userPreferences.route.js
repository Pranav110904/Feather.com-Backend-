
import { updatePreferences } from "../Controllers/userPreferences.controller.js";
import upload from "../Middleware/Multer.js"; 

router.put('/preferences', upload.fields([
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'musicWallpaper', maxCount: 1 }
]), updatePreferences);
