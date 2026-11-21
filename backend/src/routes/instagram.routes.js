import { Router } from "express";
import { instagramController } from "../controllers/instagram.controller.js";
import { trackCost } from "../middleware/trackCost.middleware.js";

const router = Router();

router.get("/", trackCost, instagramController);
router.post("/", trackCost, instagramController);

export default router;
