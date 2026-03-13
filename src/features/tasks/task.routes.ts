import { Router } from "express";
import * as controller from "./task.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createtaskSchema, updateTaskSchema, updateTaskStatusSchema } from "./task.validation";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router({mergeParams: true});

router.post(
  "/",
  protect,
  validate(createtaskSchema),
  asyncHandler(
  controller.createTaskController)
);

router.get(
  "/",
  protect,
  asyncHandler(
  controller.getThreadTasks
  )
);


router.get(
  "/:taskId",
  protect,
  asyncHandler(
  controller.getTask
  )
);


router.patch(
  "/:taskId",
  protect,
  validate(updateTaskSchema),
  asyncHandler(
  controller.updateTakController
  )
);

router.patch(
  "/:taskId/status",
  protect, validate(updateTaskStatusSchema),
  asyncHandler(controller.updateTaskStatusController)
)

router.delete(
  "/:taskId",
  protect,
  asyncHandler(
  controller.deleteTaskController
  )
);

export default router;