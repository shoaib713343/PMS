import { and, eq } from "drizzle-orm";
import { db } from "../../db";

import { messages } from "../../db/schema/messages";
import { projectThreads } from "../../db/schema/projectThreads";

import { ApiError } from "../../utils/ApiError";

import { getProjectContext } from "../../utils/getProjectContext";
import { canAccessProject } from "../../utils/projectAccess";
import { hasPermission } from "../../utils/permission";
import { ACTIONS } from "../../constants/actions";
import { users } from "../../db/schema";

type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  systemRole: "user" | "admin" | "super_admin";
};
 

class MessageService {

  
  // CREATE MESSAGE / REPLY
  
  async createMessage(options: {
    threadId: number;
    content: string;
    parentId?: number;
}, user: AuthUser) {

    const thread = await db.query.projectThreads.findFirst({
        where: eq(projectThreads.id, options.threadId),
    });

    if (!thread) {
        throw new ApiError(404, "Thread not found");
    }

    const { project, projectRole } = await getProjectContext(
        user,
        thread.projectId
    );

    // Access
    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
        throw new ApiError(403, "No access");
    }

    // Permission
    if (!hasPermission({
        user,
        action: ACTIONS.SEND_MESSAGE,
        project,
        projectRole
    })) {
        throw new ApiError(403, "Not allowed to send message");
    }

    // Reply validation
    if (options.parentId) {
        const [parent] = await db
            .select()
            .from(messages)
            .where(eq(messages.id, options.parentId));

        if (!parent || parent.threadId !== options.threadId) {
            throw new ApiError(400, "Invalid parent message");
        }
    }

    const [message] = await db.insert(messages)
        .values({
            threadId: options.threadId,
            userId: user.id,
            content: options.content,
            parentId: options.parentId
        })
        .returning();

    // ========== SEND NOTIFICATIONS TO OTHER PARTICIPANTS ==========
    try {
        // Get all participants who have sent messages in this thread (excluding current user)
        const participants = await db
            .selectDistinct({
                userId: messages.userId,
                userEmail: users.email,
                userFirstName: users.firstName,
                userLastName: users.lastName
            })
            .from(messages)
            .innerJoin(users, eq(messages.userId, users.id))
            .where(
                and(
                    eq(messages.threadId, options.threadId),
                    eq(users.isDeleted, false)
                )
            );

        // Get sender name
        const senderName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || `User ${user.id}`;

        // Get thread topic for email subject
        const threadTopic = thread.topic || 'Discussion Thread';

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const threadUrl = `${frontendUrl}/projects/${thread.projectId}/threads/${options.threadId}`;

        // Import services
        const { emailNotificationService } = await import("../../services/email.service");
        const { notificationService } = await import("../../services/notification.service");

        // Send to each participant (except the sender)
        for (const participant of participants) {
            if (participant.userId !== user.id) {
                // 1. Send Email Notification (if email exists)
                if (participant.userEmail) {
                    await emailNotificationService.sendNewMessageEmail(
                        options.threadId,
                        threadTopic,
                        options.content,
                        participant.userId,
                        senderName,
                        thread.projectId
                    );
                    console.log(`📧 Email sent to ${participant.userEmail}`);
                }

                // 2. Create In-App Notification
                await notificationService.createNotification({
                    userId: participant.userId,
                    type: 'new_message',
                    title: `New message in: ${threadTopic}`,
                    message: options.content.substring(0, 100),
                    entityType: 'thread',
                    entityId: options.threadId,
                    actionUrl: threadUrl,
                    metadata: {
                        threadId: options.threadId,
                        threadTopic: threadTopic,
                        messageId: message.id,
                        messageContent: options.content.substring(0, 200),
                        senderId: user.id,
                        senderName: senderName,
                        projectId: thread.projectId
                    }
                });
            }
        }
    } catch (error) {
        // Don't fail the message creation if notifications fail
        console.error('Failed to send notifications:', error);
    }
    // ====================================================================

    return message;
}

  
  // GET MESSAGES BY THREAD
  
  async getByThread(threadId: number, user: AuthUser) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId),
    });

    if (!thread) {
      throw new ApiError(404, "Thread not found");
    }

    const { project, projectRole } = await getProjectContext(
      user,
      thread.projectId
    );

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access");
    }

    const allMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.threadId, threadId),
          eq(messages.isDeleted, false)
        )
      )
      .orderBy(messages.createdAt);

    const parentMessages = allMessages.filter(m => !m.parentId);
    const replies = allMessages.filter(m => m.parentId);

    const replyMap = new Map<number, any[]>();

    for (const reply of replies) {
      if (reply.parentId !== null) {
        if (!replyMap.has(reply.parentId)) {
          replyMap.set(reply.parentId, []);
        }
        replyMap.get(reply.parentId)!.push(reply);
      }
    }

    return parentMessages.map(parent => ({
      ...parent,
      replies: replyMap.get(parent.id) || [],
    }));
  }

  
  // DELETE MESSAGE
  
  async deleteMessage(messageId: number, user: AuthUser) {

    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message || message.isDeleted) {
      throw new ApiError(404, "Message not found");
    }

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, message.threadId),
    });

    const { project, projectRole } = await getProjectContext(
      user,
      thread!.projectId
    );

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access");
    }

    if (!hasPermission({
      user,
      action: ACTIONS.DELETE_MESSAGE,
      project,
      projectRole,
      resource: message
    })) {
      throw new ApiError(403, "Not allowed");
    }

    await db.update(messages)
      .set({ isDeleted: true })
      .where(eq(messages.id, messageId));

    return true;
  }
}

export const messageService = new MessageService();