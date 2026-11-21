import { Router } from "express";
import { extractController } from "../controllers/extract.controller.js";
import { trackCost } from "../middleware/trackCost.middleware.js";

const router = Router();

router.get("/", trackCost, extractController);
router.post("/", trackCost, extractController);

export default router;
