import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../db/schema";
import { success } from "zod";

type NotificationType = 
    | 'task_assigned'
    | 'task_updated'
    | 'task_status_changed'
    | 'project_invite'
    | 'new_message'
    | 'task_due_reminder';

interface CreateNotificationOptions {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
    entityType?: string;
    entityId?: number;
    actionUrl?: string;
}

class NotificationService {
    async createNotification(data: CreateNotificationOptions){
        const [notification] = await db.insert(notifications).values({
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            metadata: data.metadata,
            entityType: data.entityType,
            entityId: data.entityId,
            actionUrl: data.actionUrl
        }).returning();

        return notification;
    }

    async getUserNotifications(userId: number, page: number = 1, limit: number = 20){
        const offset = (page - 1) * limit;

        const data = await db.select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit)
            .offset(offset);

        const unreadResult = await db.select({ count: sql<number>`count(*)`})
            .from(notifications)
            .where(and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false)
            ));

        const unreadCount = Number(unreadResult[0]?.count || 0);

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(eq(notifications.userId, userId));
        const total = Number(totalResult[0]?.count || 0);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total/limit),
                unreadCount
            }
        }

    }

    async markAsRead(notificationId: number, userId: number){
        const [updated] = await db.update(notifications)
            .set({ isRead: true})
            .where(and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, userId)
            )).returning();

            return updated;
    }

    async markAllAsRead(userId: number){
        await db.update(notifications)
            .set({ isRead: true})
            .where(eq(notifications.userId, userId));

            return {success: true};
    }

    async deleteNotification(notificationId: number, userId: number) {
        await db.delete(notifications)
            .where(and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, userId)
            ));
        
        return { success: true };
    }

     async getUnreadCount(userId: number) {
        const result = await db.select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false)
            ));
        
        return { unreadCount: Number(result[0]?.count || 0) };
    }
}

export const notificationService = new NotificationService();