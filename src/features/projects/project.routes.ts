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

const router = Router();

/**
 * CREATE PROJECT
 * Only admin / super_admin
 */
router.post(
  "/",
  protect,
  allowRoles("admin", "super_admin"),
  asyncHandler(createProjectController)
);

/**
 * LIST PROJECTS
 */
router.get(
  "/",
  protect,
  asyncHandler(listProjectsController)
);

/**
 * GET SINGLE PROJECT
 */
router.get(
  "/:projectId",
  protect,
  asyncHandler(getProjectDetailsController)
);

/**
 * UPDATE PROJECT
 */
router.put(
  "/:projectId",
  protect,
  allowRoles("admin", "super_admin"),
  asyncHandler(updateProjectController)
);

/**
 * DELETE PROJECT (soft delete)
 */
router.delete(
  "/:projectId",
  protect,
  allowRoles("admin", "super_admin"),
  asyncHandler(deleteProjectController)
);

/**
 * ASSIGN PROJECT MEMBER
 */
router.post(
  "/:projectId/members",
  protect,
  allowRoles("admin", "super_admin"),
  asyncHandler(assignProjectMember)
);

/**
 * REMOVE PROJECT MEMBER
 */
router.delete(
  "/:projectId/members/:userId",
  protect,
  allowRoles("admin", "super_admin"),
  asyncHandler(removeProjectMemberController)
);

export default router;