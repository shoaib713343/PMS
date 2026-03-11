import { Router } from "express";
import * as controller from "./projectThread.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createThreadSchema } from "./projectThread.validation";

const router = Router();

router.post(
  "/projects/:projectId/threads",
  protect, validate(createThreadSchema),
  controller.createThreadController
);

router.get(
  "/projects/:projectId/threads",
  protect,
  controller.getThreadsByProjectIdController
);

router.get(
  "/threads/:threadId",
  protect,
  controller.getThreadByIdController
);


router.patch(
  "/threads/:threadId",
  protect, validate(createThreadSchema),
  controller.updateThreadController
);

router.delete(
  "/threads/:threadId",
  protect,
  controller.deleteThreadController
);

export default router;