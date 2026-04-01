import { Router } from "express";
import { getProjectActivityController } from "./activity.controller";
import { protect } from "../../middleware/authMiddleware";

const router = Router({ mergeParams: true });

router.get("/", protect, getProjectActivityController);

export default router;