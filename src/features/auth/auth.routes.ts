import { Router } from "express";
import { listUsersController, login, refresh, register } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { loginSchema, registerUserSchema } from "./auth.validation";
import { asyncHandler } from "../../utils/asyncHandler";
import { protect } from "../../middleware/authMiddleware";
import { allowRoles } from "../../middleware/rbac";

const router = Router();

router.get(
  "/users",
  protect,
  allowRoles("admin", "super_admin"),
  asyncHandler(listUsersController)
);
router.post("/register", validate(registerUserSchema),asyncHandler( register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));

export default router;