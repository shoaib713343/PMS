import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { projects, taskAssignees, tasks, users } from "../db/schema";

class TaskReminderService {

    async findTasksDueTomorrow() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        
        // Find tasks due tomorrow
        const dueTasks = await db
            .select({
                id: tasks.id,
                title: tasks.title,
                description: tasks.description,
                targetDate: tasks.targetDate,
                projectId: tasks.projectId,
                projectName: projects.title,
            })
            .from(tasks)
            .innerJoin(projects, eq(tasks.projectId, projects.id))
            .where(
                and(
                    eq(tasks.isDeleted, false),
                    lte(tasks.targetDate, dayAfterTomorrow),
                    sql`${tasks.targetDate} >= ${tomorrow.toISOString()}`
                )
            );
        
        return dueTasks;
    }
    
    // Send reminders for a specific task
    async sendRemindersForTask(task: any) {
        // Get assignees for this task
        const assignees = await db
            .select({
                userId: taskAssignees.userId,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
            })
            .from(taskAssignees)
            .innerJoin(users, eq(taskAssignees.userId, users.id))
            .where(eq(taskAssignees.taskId, task.id));
        
        if (assignees.length === 0) return;
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const taskUrl = `${frontendUrl}/tasks/${task.id}`;
        const dueDate = task.targetDate ? new Date(task.targetDate).toLocaleDateString() : 'Unknown';
        
        // Import services
        const { emailNotificationService } = await import("./email.service");
        const { notificationService } = await import("./notification.service");
        
        for (const assignee of assignees) {
            if (!assignee.email) continue;
            
            // 1. Send Email Reminder
            const { emailTemplates } = await import("../config/email");
            const template = emailTemplates.taskDueReminder(
                task.title,
                dueDate,
                task.projectName,
                taskUrl
            );
            
            await emailNotificationService.sendEmailNotification(
                assignee.email,
                template.subject,
                template.html,
                'task_due_reminder'
            );
            
            // 2. Send In-App Notification
            await notificationService.createNotification({
                userId: assignee.userId,
                type: 'task_due_reminder',
                title: 'Task Due Tomorrow',
                message: `Task "${task.title}" in "${task.projectName}" is due tomorrow (${dueDate})`,
                entityType: 'task',
                entityId: task.id,
                actionUrl: taskUrl,
                metadata: {
                    taskId: task.id,
                    taskTitle: task.title,
                    dueDate: task.targetDate,
                    projectId: task.projectId,
                    projectName: task.projectName
                }
            });
        }
        
        console.log(`📧 Sent reminders for task: ${task.title} to ${assignees.length} assignee(s)`);
    }
    
    // Run the complete reminder job
    async runDueDateReminders() {
        console.log('🔍 Running task due date reminder job...');
        console.log(`Time: ${new Date().toISOString()}`);
        
        try {
            const dueTasks = await this.findTasksDueTomorrow();
            
            if (dueTasks.length === 0) {
                console.log('✅ No tasks due tomorrow.');
                return { success: true, remindersSent: 0 };
            }
            
            console.log(`📋 Found ${dueTasks.length} task(s) due tomorrow.`);
            
            for (const task of dueTasks) {
                await this.sendRemindersForTask(task);
            }
            
            console.log(`✅ Sent reminders for ${dueTasks.length} task(s).`);
            return { success: true, remindersSent: dueTasks.length };
            
        } catch (error) {
            console.error('❌ Error running due date reminders:', error);
            return { success: false, error };
        }
    }

    }

export const taskReminderService = new TaskReminderService();
