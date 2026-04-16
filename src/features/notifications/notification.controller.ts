import { Request, Response } from "express";
import { notificationService } from "../../services/notification.service";
import { ApiResponse } from "../../utils/ApiResponse";


export async function getNotificationsController(req: Request, res: Response) {
    const userId = req.user!.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    
    const result = await notificationService.getUserNotifications(userId, page, limit);
    
    return res.status(200).json(
        new ApiResponse(200, "Notifications fetched successfully", result)
    );
}

// GET /api/v1/notifications/unread-count
export async function getUnreadCountController(req: Request, res: Response) {
    const userId = req.user!.id;
    
    const result = await notificationService.getUnreadCount(userId);
    
    return res.status(200).json(
        new ApiResponse(200, "Unread count fetched", result)
    );
}

// PATCH /api/v1/notifications/:id/read
export async function markNotificationReadController(req: Request, res: Response) {
    const userId = req.user!.id;
    const notificationId = Number(req.params.id);
    
    const notification = await notificationService.markAsRead(notificationId, userId);
    
    if (!notification) {
        return res.status(404).json(new ApiResponse(404, "Notification not found", null));
    }
    
    return res.status(200).json(
        new ApiResponse(200, "Notification marked as read", notification)
    );
}

// PATCH /api/v1/notifications/read-all
export async function markAllNotificationsReadController(req: Request, res: Response) {
    const userId = req.user!.id;
    
    await notificationService.markAllAsRead(userId);
    
    return res.status(200).json(
        new ApiResponse(200, "All notifications marked as read", null)
    );
}

// DELETE /api/v1/notifications/:id
export async function deleteNotificationController(req: Request, res: Response) {
    const userId = req.user!.id;
    const notificationId = Number(req.params.id);
    
    await notificationService.deleteNotification(notificationId, userId);
    
    return res.status(200).json(
        new ApiResponse(200, "Notification deleted successfully", null)
    );
}