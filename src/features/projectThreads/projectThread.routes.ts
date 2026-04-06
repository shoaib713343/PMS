// thread.routes.ts
import { Router } from "express";
import * as controller from "./projectThread.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createThreadSchema } from "./projectThread.validation";
import taskRouter from "../tasks/task.routes";
import { asyncHandler } from "../../utils/asyncHandler";
import messageRouter from "../messages/message.routes";

const threadRouter = Router({ mergeParams: true });

// Thread CRUD - specific routes FIRST
threadRouter.post(
  "/",
  protect,
  validate(createThreadSchema),
  asyncHandler(controller.createThreadController)
);

threadRouter.get(
  "/",
  protect,
  asyncHandler(controller.getThreadsByProjectIdController)
);

threadRouter.get("/all", protect, asyncHandler(controller.getAllThreadsController));

// Parameterized routes - with :threadId
threadRouter.get(
  "/:threadId",
  protect,
  asyncHandler(controller.getThreadByIdController)
);

threadRouter.patch(
  "/:threadId",
  protect,
  asyncHandler(controller.updateThreadController)
);

threadRouter.patch(
  "/:threadId/status",
  protect,
  asyncHandler(controller.updateThreadStatusController)
);

threadRouter.delete(
  "/:threadId",
  protect,
  asyncHandler(controller.deleteThreadController)
);

// ✅ NESTED ROUTES - MUST come AFTER the parameterized routes
threadRouter.use("/:threadId/tasks", taskRouter);
threadRouter.use("/:threadId/messages", messageRouter);

export default threadRouter;