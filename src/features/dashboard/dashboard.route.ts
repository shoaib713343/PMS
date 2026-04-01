import { Router } from "express";
import { getDashboardController } from "./dashboard.controller";
import { protect } from "../../middleware/authMiddleware";

const router = Router();

router.get("/dashboard", protect, getDashboardController);

export default router;