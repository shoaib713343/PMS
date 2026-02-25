import {Router} from "express";
import { validate } from "../../middleware/validate";
import { registerUserSchema } from "../auth/auth.validation";
import { asyncHandler } from "../../utils/asyncHandler";
import { createUserController, deleteUserController, getUserController, listUsersController, updateUserController } from "./user.controller";
import { protect } from "../../middleware/authMiddleware";
import { allowRoles } from "../../middleware/rbac";
import { createUserSchema, updateUserSchema } from "./user.validation";

const router = Router();

router.post("/",protect, allowRoles("super_admin"), validate(createUserSchema),asyncHandler(createUserController));
router.get("/", protect, allowRoles("admin", "super_admin"), asyncHandler(listUsersController));
router.get("/:id", protect, allowRoles("admin", "super_admin"), asyncHandler(getUserController));
router.put("/:id", protect, allowRoles("super_admin"), asyncHandler(updateUserController));
router.delete("/:id", protect, allowRoles("super_admin"), validate(updateUserSchema), asyncHandler(deleteUserController));

export default router;