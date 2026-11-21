import { Router } from "express";
import { videoController } from "../controllers/video.controller.js";
import { trackCost } from "../middleware/trackCost.middleware.js";
import { uploadVideo } from "../middleware/uploadVideo.middleware.js";

const router = Router();

// trackCost goes after the upload, so the tracking context isn't lost in multer's stream callbacks.
router.post("/", uploadVideo, trackCost, videoController);

export default router;
