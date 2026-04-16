import { and, eq, asc, desc, count, sql } from "drizzle-orm";
import { db } from "../../db";

import { projectThreads } from "../../db/schema/projectThreads";
import { tasks } from "../../db/schema/tasks";
import { taskAssignees } from "../../db/schema/taskAssignees";
import { projects } from "../../db/schema/projects";

import { ApiError } from "../../utils/ApiError";

import { getProjectContext } from "../../utils/getProjectContext";
import { canAccessProject } from "../../utils/projectAccess";
import { hasPermission } from "../../utils/permission";
import { ACTIONS } from "../../constants/actions";

import { logActivity } from "../activity/activity.service";

type AuthUser = {
  id: number;
  firstName: string;
  lastName: string;
  systemRole: "admin" | "user" | "super_admin";
};

class TaskService {

  // CREATE TASK - FIXED to support both projectId and threadId
  async createTask(options: any, user: AuthUser) {
    let projectId = options.projectId;
    let threadId = options.threadId;

    // If only threadId is provided, derive projectId from thread
    if (!projectId && threadId) {
        const thread = await db.query.projectThreads.findFirst({
            where: eq(projectThreads.id, threadId),
        });

        if (!thread || thread.isDeleted) {
            throw new ApiError(404, "Thread not found");
        }
        projectId = thread.projectId;
    }

    if (!projectId) {
        throw new ApiError(400, "Either projectId or threadId is required");
    }

    // Get project context for access check
    const { project, projectRole } = await getProjectContext(user, projectId);

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
        throw new ApiError(403, "No access");
    }

    if (!hasPermission({
        user,
        action: ACTIONS.CREATE_TASK,
        project,
        projectRole
    })) {
        throw new ApiError(403, "Not allowed to create task");
    }

    return db.transaction(async (tx) => {
        const [task] = await tx.insert(tasks).values({
            projectId: projectId,
            threadId: threadId || null,
            title: options.title,
            description: options.description,
            gitLink: options.gitLink,
            targetDate: options.targetDate,
            createdUser: user.id,
        }).returning();

        if (options.assignedUserIds?.length) {
            await tx.insert(taskAssignees).values(
                options.assignedUserIds.map((uId: number) => ({
                    taskId: task.id,
                    userId: uId,
                }))
            );

            const projectData = await tx.query.projects.findFirst({
                where: eq(projects.id, projectId),
            });

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const taskUrl = `${frontendUrl}/tasks/${task.id}`;

            // Import services
            const { emailNotificationService } = await import("../../services/email.service");
            const { notificationService } = await import("../../services/notification.service");

            for (const assignedUserId of options.assignedUserIds) {
                // 1. Send Email Notification
                await emailNotificationService.sendTaskAssignmentEmail(
                    task.id,
                    assignedUserId,
                    options.title,
                    projectData?.title || "Project"
                );

                // 2. Create In-App Notification
                await notificationService.createNotification({
                    userId: assignedUserId,
                    type: 'task_assigned',
                    title: 'New Task Assigned',
                    message: `You have been assigned: ${options.title}`,
                    entityType: 'task',
                    entityId: task.id,
                    actionUrl: taskUrl,
                    metadata: { 
                        taskTitle: options.title, 
                        projectId: projectId,
                        projectName: projectData?.title,
                        assignedBy: user.id,
                        assignedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    }
                });
            }
        }

        await logActivity({
            userId: user.id,
            action: "TASK_CREATED",
            entity: "TASK",
            entityId: task.id,
            projectId: projectId,
        });

        return task;
    });
}

  // GET TASKS FOR USER - FIXED for new structure
  async getTasksForUser(
    user: AuthUser,
    pagination: {
      page: number;
      limit: number;
      sortBy?: string;
      order?: string;
    }
  ) {
    const { page, limit, sortBy, order } = pagination;
    const offset = (page - 1) * limit;

    const baseSelect = {
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.taskStatus,
      projectId: tasks.projectId,
      threadId: tasks.threadId,
    };

    let query: any;
    let whereClause: any;

    // super_admin → all tasks
    if (user.systemRole === "super_admin") {
      query = db.select(baseSelect).from(tasks);
      whereClause = eq(tasks.isDeleted, false);
    }

    // admin → only tasks from own projects
    else if (user.systemRole === "admin") {
      query = db
        .select(baseSelect)
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id));
      
      whereClause = and(
        eq(projects.createdBy, user.id),
        eq(tasks.isDeleted, false)
      );
    }

    // user → only assigned tasks
    else {
      query = db
        .select(baseSelect)
        .from(tasks)
        .innerJoin(taskAssignees, eq(tasks.id, taskAssignees.taskId));
      
      whereClause = and(
        eq(taskAssignees.userId, user.id),
        eq(tasks.isDeleted, false)
      );
    }

    // Add sorting
    if (sortBy && order) {
      const sortableColumns: Record<string, any> = {
        id: tasks.id,
        title: tasks.title,
        status: tasks.taskStatus,
      };
      const column = sortableColumns[sortBy];
      if (column) {
        query = query.orderBy(order === 'desc' ? desc(column) : asc(column));
      }
    }

    // Execute the main query
    const data = await query
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    let countQuery: any = db.select({ count: sql<number>`count(*)` }).from(tasks);
    
    if (user.systemRole === "admin") {
      countQuery = countQuery.innerJoin(projects, eq(tasks.projectId, projects.id));
    } else if (user.systemRole === "user") {
      countQuery = countQuery.innerJoin(taskAssignees, eq(tasks.id, taskAssignees.taskId));
    }
    
    const countResult = await countQuery.where(whereClause);
    const total = Number(countResult[0]?.count) || 0;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  // GET TASK BY ID - FIXED
  async getTaskById(taskId: number, user: AuthUser) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    // Use projectId directly instead of going through thread
    const { project, projectRole } = await getProjectContext(user, task.projectId);

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access");
    }

    return task;
  }

  // NEW METHOD: Get tasks by project (recommended)

async getProjectTasksService(
  projectId: number,
  user: AuthUser,
  pagination: {
    page: number;
    limit: number;
    sortBy?: string;
    order?: string;
  }
) {
  const { page, limit, sortBy, order } = pagination;
  const offset = (page - 1) * limit;

  // Check project access
  const { project, projectRole } = await getProjectContext(user, projectId);
  
  if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
    throw new ApiError(403, "No access");
  }

  const selectFields = {
    id: tasks.id,
    title: tasks.title,
    description: tasks.description,
    taskStatus: tasks.taskStatus,
    createdUser: tasks.createdUser,
    projectId: tasks.projectId,
    threadId: tasks.threadId,
    gitLink: tasks.gitLink,
    targetDate: tasks.targetDate,
    createdAt: tasks.createdAt,
    updatedAt: tasks.updatedAt,
  };

  // Build where clause
  const whereConditions = [eq(tasks.projectId, projectId), eq(tasks.isDeleted, false)];
  if (user.systemRole === "user") {
    whereConditions.push(eq(taskAssignees.userId, user.id));
  }
  const whereClause = and(...whereConditions);

  // Build main query
  let mainQuery: any = db.select(selectFields).from(tasks);
  if (user.systemRole === "user") {
    mainQuery = mainQuery.innerJoin(taskAssignees, eq(tasks.id, taskAssignees.taskId));
  }

  // Add sorting
  if (sortBy && order) {
    const sortableColumns: Record<string, any> = {
      id: tasks.id,
      title: tasks.title,
      taskStatus: tasks.taskStatus,
      createdUser: tasks.createdUser,
      createdAt: tasks.createdAt,
    };
    
    const column = sortableColumns[sortBy];
    if (column) {
      mainQuery = mainQuery.orderBy(order === 'desc' ? desc(column) : asc(column));
    }
  } else {
    mainQuery = mainQuery.orderBy(desc(tasks.createdAt));
  }

  // Build count query
  let countQuery: any = db.select({ count: count() }).from(tasks);
  if (user.systemRole === "user") {
    countQuery = countQuery.innerJoin(taskAssignees, eq(tasks.id, taskAssignees.taskId));
  }

  // Execute queries
  const [data, countResult] = await Promise.all([
    mainQuery.where(whereClause).limit(limit).offset(offset),
    countQuery.where(whereClause)
  ]);

  // Fetch assignees for each task
  const tasksWithAssignees = await Promise.all(
    data.map(async (task: any) => {
      const assignees = await db.select({
        userId: taskAssignees.userId
      }).from(taskAssignees).where(eq(taskAssignees.taskId, task.id));
      
      return {
        ...task,
        assignees: assignees.map(a => a.userId)
      };
    })
  );

  return {
    data: tasksWithAssignees,
    pagination: {
      page,
      limit,
      total: Number(countResult[0]?.count) || 0,
      totalPages: Math.ceil((Number(countResult[0]?.count) || 0) / limit)
    }
  };
}

  // GET THREAD TASKS - FIXED (now redirects to project tasks)
  async getThreadTasksService(
    threadId: number,
    user: AuthUser,
    pagination: {
      page: number;
      limit: number;
      sortBy?: string;
      order?: string;
    },
    query?: any
  ) {
    // Get thread to find projectId
    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId),
    });

    if (!thread || thread.isDeleted) {
      throw new ApiError(404, "Thread not found");
    }

    // Redirect to project-based query (maintains backward compatibility)
    return this.getProjectTasksService(thread.projectId, user, pagination);
  }
  
  // UPDATE TASK - FIXED
  async updateTask(taskId: number, data: any, user: AuthUser) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    // Use projectId directly
    const { project, projectRole } = await getProjectContext(user, task.projectId);

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access");
    }

    if (!hasPermission({
      user,
      action: ACTIONS.UPDATE_TASK,
      project,
      projectRole,
      resource: task
    })) {
      throw new ApiError(403, "Not allowed");
    }

    const [updated] = await db.update(tasks)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId))
      .returning();

    await logActivity({
      userId: user.id,
      action: "TASK_UPDATED",
      entity: "TASK",
      entityId: taskId,
      projectId: task.projectId
    });

    return updated;
  }

  // UPDATE TASK STATUS - FIXED
  async updateTaskStatus(
    taskId: number,
    status: string,
    user: AuthUser
) {
    // Get task
    const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
        throw new ApiError(404, "Task not found");
    }

    // Project context using projectId directly
    const { project, projectRole } = await getProjectContext(user, task.projectId);

    // Access check
    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
        throw new ApiError(403, "No access");
    }

    // Permission check
    if (!hasPermission({
        user,
        action: ACTIONS.UPDATE_TASK,
        project,
        projectRole,
        resource: task
    })) {
        throw new ApiError(403, "Not allowed to update task status");
    }

    const oldStatus = task.taskStatus;

    // Update status
    const [updated] = await db.update(tasks)
        .set({
            taskStatus: status,
            updatedAt: new Date()
        })
        .where(eq(tasks.id, taskId))
        .returning();

    // ========== SEND NOTIFICATIONS TO ASSIGNEES ==========
    const assignees = await db.select()
        .from(taskAssignees)
        .where(eq(taskAssignees.taskId, taskId));

    if (assignees.length > 0) {
        // Get project details for notifications
        const projectData = await db.query.projects.findFirst({
            where: eq(projects.id, task.projectId),
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const taskUrl = `${frontendUrl}/tasks/${taskId}`;

        const updaterName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || `User ${user.id}`;

        // Import services
        const { emailNotificationService } = await import("../../services/email.service");
        const { notificationService } = await import("../../services/notification.service");

        for (const assignee of assignees) {
            if (assignee.userId !== user.id) {
                // 1. Send Email Notification
                await emailNotificationService.sendTaskStatusChangedEmail(
                    taskId,
                    assignee.userId,
                    task.title,
                    oldStatus || 'unknown',
                    status
                );

                // 2. Send In-App Notification
                await notificationService.createNotification({
                    userId: assignee.userId,
                    type: 'task_status_changed',
                    title: 'Task Status Updated',
                    message: `Task "${task.title}" status changed from ${oldStatus} to ${status}`,
                    entityType: 'task',
                    entityId: taskId,
                    actionUrl: taskUrl,
                    metadata: {
                        taskId: taskId,
                        taskTitle: task.title,
                        oldStatus: oldStatus,
                        newStatus: status,
                        projectId: task.projectId,
                        projectName: projectData?.title,
                        updatedBy: user.id,
                        updatedByName: updaterName,
                        updatedAt: new Date().toISOString()
                    }
                });
            }
        }
    }
    // ====================================================

    return updated;
}
  
  // DELETE TASK - FIXED
  async deleteTask(taskId: number, user: AuthUser) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    // Use projectId directly
    const { project, projectRole } = await getProjectContext(user, task.projectId);

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access");
    }

    if (!hasPermission({
      user,
      action: ACTIONS.DELETE_TASK,
      project,
      projectRole,
      resource: task
    })) {
      throw new ApiError(403, "Not allowed");
    }

    await db.update(tasks)
      .set({ isDeleted: true })
      .where(eq(tasks.id, taskId));

    await logActivity({
      userId: user.id,
      action: "TASK_DELETED",
      entity: "TASK",
      entityId: taskId,
      projectId: task.projectId
    });

    return { success: true };
  }
}

export const taskService = new TaskService();