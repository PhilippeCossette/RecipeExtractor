import { Router } from "express";
import { parseIngredientsController } from "../controllers/ingredients.controller.js";

const router = Router();

router.post("/parse", parseIngredientsController);

export default router;
