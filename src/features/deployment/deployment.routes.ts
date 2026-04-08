import { Router } from "express";
import { protect } from "../../middleware/authMiddleware";
import { allowRoles } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createServerController,
  listServersController,
  assignServerToProjectController,
  createServiceController,
  listServicesController,
  assignServiceToUserController,
  updateServerController,
  deleteServerController,
  updateServiceController,
  deleteServiceController,
  removeServiceFromUserController,
} from "./deployment.controller";

const router = Router({ mergeParams: true });

// Server routes
router.post("/servers", protect, allowRoles("super_admin"), asyncHandler(createServerController));
router.get("/servers", protect, allowRoles("super_admin", "admin"), asyncHandler(listServersController));
router.post("/projects/:projectId/servers/:serverId", protect, allowRoles("super_admin"), asyncHandler(assignServerToProjectController));

// Service routes
router.post("/services", protect, allowRoles("super_admin"), asyncHandler(createServiceController));
router.get("/services", protect, allowRoles("super_admin", "admin"), asyncHandler(listServicesController));
router.post("/users/:userId/services/:serviceId", protect, allowRoles("super_admin"), asyncHandler(assignServiceToUserController));


router.put("/servers/:serverId", protect, allowRoles("super_admin"), asyncHandler(updateServerController));
router.delete("/servers/:serverId", protect, allowRoles("super_admin"), asyncHandler(deleteServerController));
router.put("/services/:serviceId", protect, allowRoles("super_admin"), asyncHandler(updateServiceController));
router.delete("/services/:serviceId", protect, allowRoles("super_admin"), asyncHandler(deleteServiceController));
router.delete("/users/:userId/services/:serviceId", protect, allowRoles("super_admin"), asyncHandler(removeServiceFromUserController));
export default router;