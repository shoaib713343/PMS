import { Router } from "express";
import { getDashboardController } from "./dashboard.controller";
import { protect } from "../../middleware/authMiddleware";

const router = Router();

router.get("/", protect, getDashboardController);

export default router;