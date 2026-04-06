// task.routes.ts
import { Router } from "express";
import * as controller from "./task.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createtaskSchema, updateTaskSchema, updateTaskStatusSchema } from "./task.validation";
import { asyncHandler } from "../../utils/asyncHandler";
import attachmentRoutes from "../attachments/attachment.routes";

const taskRouter = Router({ mergeParams: true });  // ← IMPORTANT: mergeParams must be true

// These routes will be accessible at:
// - /threads/:threadId/tasks (when mounted under threadRouter)
// - /projects/:projectId/tasks (when mounted under projectRouter)
// - /tasks (when mounted directly)

// Get all tasks for user (with pagination)
taskRouter.get(
  "/all",
  protect,
  asyncHandler(controller.getAllTasksController)
);

// Create task - threadId/projectId will come from parent route params
taskRouter.post(
  "/",
  protect,
  validate(createtaskSchema),
  asyncHandler(controller.createTaskController)
);

// Get tasks by project - this is a specific route, must come before /:taskId
taskRouter.get(
  "/projects/:projectId",
  protect,
  asyncHandler(controller.getProjectTasksController)
);

// Get tasks by thread (existing)
taskRouter.get(
  "/",
  protect,
  asyncHandler(controller.getThreadTasks)
);

// Get single task - this must come AFTER specific routes
taskRouter.get(
  "/:taskId",
  protect,
  asyncHandler(controller.getTask)
);

// Update task
taskRouter.patch(
  "/:taskId",
  protect,
  validate(updateTaskSchema),
  asyncHandler(controller.updateTaskController)
);

// Update task status
taskRouter.patch(
  "/:taskId/status",
  protect,
  validate(updateTaskStatusSchema),
  asyncHandler(controller.updateTaskStatusController)
);

// Delete task
taskRouter.delete(
  "/:taskId",
  protect,
  asyncHandler(controller.deleteTaskController)
);

// Attachments routes
taskRouter.use("/:taskId/attachments", attachmentRoutes);

export default taskRouter;