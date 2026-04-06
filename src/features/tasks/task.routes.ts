import { Router } from "express";
import * as controller from "./task.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createtaskSchema, updateTaskSchema, updateTaskStatusSchema } from "./task.validation";
import { asyncHandler } from "../../utils/asyncHandler";
import attachmentRoutes from "../attachments/attachment.routes";

const taskRouter = Router();

// ✅ SPECIFIC ROUTES FIRST (exact paths)
// Get all tasks for user (with pagination)
taskRouter.get(
  "/all",
  protect,
  asyncHandler(controller.getAllTasksController)
);

// Get tasks by project
taskRouter.get(
  "/projects/:projectId",
  protect,
  asyncHandler(controller.getProjectTasksController)
);

// Create task
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
// Get single task
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

export default taskRouter;  // ← Make sure this exports taskRouter, not router