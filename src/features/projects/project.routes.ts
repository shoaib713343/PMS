// project.routes.ts
import { Router } from "express";
import { protect } from "../../middleware/authMiddleware";
import { allowRoles } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";
import logsRouter from "../activity/activity.routes";
import taskRouter from "../tasks/task.routes";

import {
  createProjectController,
  listProjectsController,
  getProjectDetailsController,
  updateProjectController,
  deleteProjectController,
  assignProjectMember,
  removeProjectMemberController,
} from "./project.controller";
import threadRouter from "../projectThreads/projectThread.routes";
import { upload } from "../../middleware/multerMiddleware";

const router = Router({ mergeParams: true });

// Project CRUD
router.post(
  "/",
  protect,
  allowRoles("admin", "super_admin"),
  upload.single("user_manual"),
  asyncHandler(createProjectController)
);

router.get(
  "/",
  protect,
  asyncHandler(listProjectsController)
);

router.get(
  "/:projectId",
  protect,
  asyncHandler(getProjectDetailsController)
);

router.put(
  "/:projectId",
  protect,
  asyncHandler(updateProjectController)
);

router.delete(
  "/:projectId",
  protect,
  asyncHandler(deleteProjectController)
);

// Member routes
router.post(
  "/:projectId/members",
  protect,
  allowRoles("admin", "super_admin"),
  asyncHandler(assignProjectMember)
);

router.delete(
  "/:projectId/members/:userId",
  protect,
  allowRoles("admin", "super_admin"),
  asyncHandler(removeProjectMemberController)
);

// ✅ NESTED ROUTES
router.use("/:projectId/activity", logsRouter);
router.use("/:projectId/threads", threadRouter);
router.use("/:projectId/tasks", taskRouter);

export default router;