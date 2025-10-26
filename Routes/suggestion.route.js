import { Router } from 'express';
import { trendingSuggestions } from '../Controllers/suggestion.controller.js';
const suggestionRouter = Router();

suggestionRouter.get("/trending", trendingSuggestions);

export default suggestionRouter;
