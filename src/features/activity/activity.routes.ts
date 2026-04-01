import { Router } from "express";
import { getProjectActivityLogsController } from "./activity.controller";
import { protect } from "../../middleware/authMiddleware";

const router = Router();

router.get("/", protect, getProjectActivityLogsController);

export default router;