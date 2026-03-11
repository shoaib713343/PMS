import { Router } from "express";
import * as controller from "./task.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createtaskSchema, updateTaskSchema } from "./task.validation";

const router = Router();

router.post(
  "/threads/:threadId/tasks",
  protect,
  validate(createtaskSchema),
  controller.createTaskController
);

router.get(
  "/threads/:threadId/tasks",
  protect,
  controller.getThreadTasks
);


router.get(
  "/tasks/:taskId",
  protect,
  controller.getTask
);


router.patch(
  "/tasks/:taskId",
  protect,
  validate(updateTaskSchema),
  controller.updateTakController
);


router.delete(
  "/tasks/:taskId",
  protect,
  controller.deleteTaskController
);

export default router;