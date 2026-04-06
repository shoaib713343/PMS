import { Router } from "express";
import * as controller from "./task.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createtaskSchema, updateTaskSchema, updateTaskStatusSchema } from "./task.validation";
import { asyncHandler } from "../../utils/asyncHandler";
import attachmentRoutes from "../attachments/attachment.routes";

const router = Router({mergeParams: true});

export const taskRouter = Router();

// Get all tasks for user (with pagination)
router.get(
  "/all",
  protect,
  asyncHandler(controller.getAllTasksController)
);


// Create task
router.post(
  "/",
  protect,
  validate(createtaskSchema),
  asyncHandler(controller.createTaskController)
);


// Get tasks by project - NEW ENDPOINT
router.get(
  "/projects/:projectId",
  protect,
  asyncHandler(controller.getProjectTasksController)
);

// Get tasks by thread (existing)
router.get(
  "/",
  protect,
  asyncHandler(controller.getThreadTasks)
);

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

export default router;