import { Router } from "express";
import * as controller from "./projectThread.controller";
import { protect } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createThreadSchema } from "./projectThread.validation";

const threadRouter = Router();
export const topLevelThreadRouter = Router({mergeParams: true});


threadRouter.post(
  "/",
  protect, validate(createThreadSchema),
  controller.createThreadController
);

threadRouter.get(
  "/",
  protect,
  controller.getThreadsByProjectIdController
);

threadRouter.get(
  "/:threadId",
  protect,
  controller.getThreadByIdController
);


threadRouter.patch(
  "/:threadId",
  protect, validate(createThreadSchema),
  controller.updateThreadController
);

threadRouter.delete(
  "/:threadId",
  protect,
  controller.deleteThreadController
);

export default threadRouter;