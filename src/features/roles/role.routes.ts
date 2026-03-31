import { Router } from "express";
import { protect } from "../../middleware/authMiddleware";
import { allowRoles } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createRoleSchema } from "./role.validation";
import { asyncHandler } from "../../utils/asyncHandler";
import { createRoleController, deleteRoleController, listRoleByIdController, listRolesController, updateRoleController } from "./role.controller";

const router = Router();

router.post("/", protect, allowRoles("super_admin"), validate(createRoleSchema), asyncHandler(createRoleController));
router.get("/", protect, allowRoles("super_admin", "admin"), asyncHandler(listRolesController));
router.get("/:id", protect, allowRoles("super_admin", "admin"), asyncHandler(listRoleByIdController));
router.put("/:id", protect, allowRoles("super_admin"), asyncHandler(updateRoleController));
router.delete("/:id", protect, allowRoles("super_admin"), asyncHandler(deleteRoleController));

export default router;