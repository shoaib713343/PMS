import { Router } from "express";
import { protect } from "../../middleware/authMiddleware";
import { allowRoles } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";

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

const router = Router();


router.post(
  "/",
  protect,
  allowRoles("admin", "super_admin"),
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
  allowRoles("admin", "super_admin"),
  asyncHandler(updateProjectController)
);


router.delete(
  "/:projectId",
  protect,
  allowRoles("admin", "super_admin"),
  asyncHandler(deleteProjectController)
);


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

router.use("/:projectId/threads", threadRouter);

export default router;