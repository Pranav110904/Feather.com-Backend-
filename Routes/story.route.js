import { Router } from 'express';
import { uploadStoryController, getStoriesController } from '../Controllers/story.controller.js';
import  auth  from '../Middleware/auth.js';
import upload from '../Middleware/Multer.js'


const storyRoute = Router();


storyRoute.post("/upload",auth, upload.single("file"), uploadStoryController);
storyRoute.get("/feed",auth,getStoriesController
);

export default storyRoute;