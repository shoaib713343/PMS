import { Router } from "express";
import { login, refresh, register } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { loginSchema, registerUserSchema } from "./auth.validation";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/register", validate(registerUserSchema),asyncHandler( register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));

export default router;