import { Router } from "express";
import { upload } from "../../middleware/multerMiddleware";
import { deleteAttachment, uploadTaskAttachment } from "./attachment.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { protect } from "../../middleware/authMiddleware";

const router = Router({ mergeParams: true});

router.post(
  "/", protect,
  upload.single("file"), asyncHandler(
  uploadTaskAttachment)
);

router.delete(
    "/:attachmentId", protect, asyncHandler(
        deleteAttachment
    )
)

export default router;