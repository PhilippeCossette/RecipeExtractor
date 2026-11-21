import { Router } from "express";
import { youtubeController } from "../controllers/youtube.controller.js";
import { trackCost } from "../middleware/trackCost.middleware.js";

const router = Router();

router.get("/", trackCost, youtubeController);
router.post("/", trackCost, youtubeController);

export default router;
