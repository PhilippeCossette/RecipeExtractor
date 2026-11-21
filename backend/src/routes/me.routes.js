import { Router } from "express";
import { meController } from "../controllers/me.controller.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";

const router = Router();

router.get("/", requireAuth, meController);

export default router;
