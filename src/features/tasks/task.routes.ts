import { Router } from "express";
import * as controller from "./task.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createtaskSchema, updateTaskSchema, updateTaskStatusSchema } from "./task.validation";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router({mergeParams: true});

router.post(
  "/threads/:threadId/tasks",
  protect,
  validate(createtaskSchema),
  asyncHandler(
  controller.createTaskController)
);

router.get(
  "/threads/:threadId/tasks",
  protect,
  asyncHandler(
  controller.getThreadTasks
  )
);


router.get(
  "/tasks/:taskId",
  protect,
  asyncHandler(
  controller.getTask
  )
);


router.patch(
  "/tasks/:taskId",
  protect,
  validate(updateTaskSchema),
  asyncHandler(
  controller.updateTakController
  )
);

router.patch(
  "/tasks/:taskId/status",
  protect, validate(updateTaskStatusSchema),
  asyncHandler(controller.updateTaskStatusController)
)

router.delete(
  "/tasks/:taskId",
  protect,
  asyncHandler(
  controller.deleteTaskController
  )
);

export default router;