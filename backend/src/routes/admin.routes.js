import { Router } from "express";
import { costLogsController, costSummaryController } from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.middleware.js";
import { requireAuth } from "../middleware/requireAuth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { CostLogsQuerySchema, CostSummaryQuerySchema } from "../validators/admin.validator.js";

// Everything under /admin needs a signed-in user with role "admin".
const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/costs/summary", validate({ query: CostSummaryQuerySchema }), costSummaryController);
router.get("/costs/requests", validate({ query: CostLogsQuerySchema }), costLogsController);

export default router;
