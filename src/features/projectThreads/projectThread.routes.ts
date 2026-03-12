import { Router } from "express";
import * as controller from "./projectThread.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createThreadSchema } from "./projectThread.validation";
import taskRouter from "../tasks/task.routes";
import { asyncHandler } from "../../utils/asyncHandler";

const threadRouter = Router({mergeParams: true});

threadRouter.post(
  "/",
  protect, validate(createThreadSchema), asyncHandler(
  controller.createThreadController)
);

threadRouter.get(
  "/",
  protect, asyncHandler(
  controller.getThreadsByProjectIdController)
);

threadRouter.get(
  "/:threadId",
  protect, asyncHandler(
  controller.getThreadByIdController)
);


threadRouter.patch(
  "/:threadId",
  protect, validate(createThreadSchema), asyncHandler(
  controller.updateThreadController)
);

threadRouter.patch(
  "/:threadId/status",
  protect, asyncHandler(controller.updateThreadStatusController)
)

threadRouter.delete(
  "/:threadId",
  protect, asyncHandler(
  controller.deleteThreadController)
);

threadRouter.use(
  "/:threadId/tasks", taskRouter
)

export default threadRouter;