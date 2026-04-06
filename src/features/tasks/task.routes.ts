// task.routes.ts
import { Router } from "express";
import * as controller from "./task.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createtaskSchema, updateTaskSchema, updateTaskStatusSchema } from "./task.validation";
import { asyncHandler } from "../../utils/asyncHandler";
import attachmentRoutes from "../attachments/attachment.routes";

const taskRouter = Router({ mergeParams: true });

// ✅ SPECIFIC ROUTES FIRST (exact paths)
taskRouter.get(
  "/all",
  protect,
  asyncHandler(controller.getAllTasksController)
);

taskRouter.get(
  "/projects/:projectId",
  protect,
  asyncHandler(controller.getProjectTasksController)
);

// ✅ Create task - THIS IS WHAT YOU NEED FOR POST /threads/:threadId/tasks
taskRouter.post(
  "/",
  protect,
  validate(createtaskSchema),
  asyncHandler(controller.createTaskController)
);

// Get tasks by thread (existing)
taskRouter.get(
  "/",
  protect,
  asyncHandler(controller.getThreadTasks)
);

// ✅ PARAMETERIZED ROUTES LAST
taskRouter.get(
  "/:taskId",
  protect,
  asyncHandler(controller.getTask)
);

taskRouter.patch(
  "/:taskId",
  protect,
  validate(updateTaskSchema),
  asyncHandler(controller.updateTaskController)
);

taskRouter.patch(
  "/:taskId/status",
  protect,
  validate(updateTaskStatusSchema),
  asyncHandler(controller.updateTaskStatusController)
);

taskRouter.delete(
  "/:taskId",
  protect,
  asyncHandler(controller.deleteTaskController)
);

taskRouter.use("/:taskId/attachments", attachmentRoutes);

export default taskRouter;