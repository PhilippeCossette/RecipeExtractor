import { Router } from "express";
import { tiktokController } from "../controllers/tiktok.controller.js";
import { trackCost } from "../middleware/trackCost.middleware.js";

const router = Router();

router.get("/", trackCost, tiktokController);
router.post("/", trackCost, tiktokController);

export default router;
