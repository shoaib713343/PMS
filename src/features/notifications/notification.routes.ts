import { Router } from "express";
import { protect } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
    getNotificationsController,
    getUnreadCountController,
    markNotificationReadController,
    markAllNotificationsReadController,
    deleteNotificationController,
} from "./notification.controller";

const router = Router();

// All routes require authentication
router.use(protect);

// Get all notifications (paginated)
router.get("/", asyncHandler(getNotificationsController));

// Get unread count only (for bell badge)
router.get("/unread-count", asyncHandler(getUnreadCountController));

// Mark single notification as read
router.patch("/:id/read", asyncHandler(markNotificationReadController));

// Mark all notifications as read
router.patch("/read-all", asyncHandler(markAllNotificationsReadController));

// Delete notification
router.delete("/:id", asyncHandler(deleteNotificationController));

export default router;