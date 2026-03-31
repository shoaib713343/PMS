import { Router } from "express";
import { createMessageController, getMessages, replyToMessage } from "./message.controller";
import { protect } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router({mergeParams: true});

router.post("/", protect, asyncHandler( createMessageController));

router.get("/", protect, asyncHandler(getMessages));

router.post(
  "/:messageId/replies", protect, asyncHandler(
  replyToMessage
  )
);


export default router;