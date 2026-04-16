import { eq } from "drizzle-orm";
import { emailLogs, users } from "../db/schema";
import { db } from "../db";
import { sendEmailWithLogging } from "../config/email";

export class EmailNotificationService {
    async sendTaskAssignmentEmail(taskId: number, assignedUserId: number, TaskTitle: string, projectName: string){
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const taskUrl = `${frontendUrl}/tasks/${taskId}`;

        const user = await db.select({email: users.email})
            .from(users)
            .where(eq(users.id, assignedUserId))
            .then(result => result[0]);

        if(!user?.email){
            console.log(`No email found for user ${assignedUserId}`);
            return;
        }

        const {emailTemplates} = await import("../config/email");
        const template = emailTemplates.taskAssigned(TaskTitle, projectName, taskUrl);

        await sendEmailWithLogging(
            user.email,
            template.subject,
            template.html,
            'task_assigned'
        );
    
    }

    async sendTaskStatusChangedEmail(taskId: number, userId: number, taskTitle: string, oldStatus: string, newStatus: string) {
        const frontendUrl = process.env.FRONTEND_URL || "http://Localhost:5173";
        const taskUrl = `${frontendUrl}/tasks/${taskId}`;

        const user = await db.select({email: users.email})
            .from(users)
            .where(eq(users.id, userId))
            .then(result => result[0]);

        if(!user?.email) return;

        const {emailTemplates} = await import("../config/email");
        const template = emailTemplates.taskStatusChanged(taskTitle, oldStatus, newStatus, taskUrl);

        await sendEmailWithLogging(
            user.email,
            template.subject,
            template.html,
            'task_status_changed'
        );
    }

    async sendProjectInviteEmail(projectId: number, invitedUserId: number, projectName: string, role: string, invitedByName: string){
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const projectUrl = `${frontendUrl}/projects/${projectId}`;

        const user =  await db.select({ email: users.email})
            .from(users)
            .where(eq(users.id, invitedUserId))
            .then(result => result[0]);

        if(!user?.email) return;

        const {emailTemplates} = await import("../config/email");
        const template = emailTemplates.projectInvite(projectName, role, projectUrl, invitedByName);

        await sendEmailWithLogging(
            user.email,
            template.subject,
            template.html,
            'project_invite'
        );

    }

     async sendNewMessageEmail(threadId: number, threadTopic: string, messageContent: string, recipientUserId: number, senderName: string, projectId: number) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const threadUrl = `${frontendUrl}/projects/${projectId}/threads/${threadId}`;
    
    const user = await db.select({ email: users.email })
      .from(users)
      .where(eq(users.id, recipientUserId))
      .then(res => res[0]);
    
    if (!user?.email) return;
    
    const { emailTemplates } = await import("../config/email");
    const template = emailTemplates.newMessage(threadTopic, messageContent, threadUrl, senderName);
    
    await sendEmailWithLogging(
      user.email,
      template.subject,
      template.html,
      'new_message'
    );
    }

     async sendEmailNotification(to: string, subject: string, html: string, type: string) {
        const { sendEmailWithLogging } = await import("../config/email");
        return await sendEmailWithLogging(to, subject, html, type);
    }
}

export const emailNotificationService = new EmailNotificationService();