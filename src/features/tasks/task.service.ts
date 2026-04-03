import { and, eq, asc, desc, count, sql } from "drizzle-orm";
import { db } from "../../db";

import { projectThreads } from "../../db/schema/projectThreads";
import { tasks } from "../../db/schema/tasks";
import { taskAssignees } from "../../db/schema/taskAssignees";

import { ApiError } from "../../utils/ApiError";

import { getProjectContext } from "../../utils/getProjectContext";
import { canAccessProject } from "../../utils/projectAccess";
import { hasPermission } from "../../utils/permission";
import { ACTIONS } from "../../constants/actions";

import { logActivity } from "../activity/activity.service";
import { projects } from "../../db/schema";

type AuthUser = {
  id: number;
  systemRole: "admin" | "user" | "super_admin";
};

class TaskService {

  // CREATE TASK
  
  async createTask(options: any, user: AuthUser) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, options.threadId),
    });

    if (!thread || thread.isDeleted) {
      throw new ApiError(404, "Thread not found");
    }

    const { project, projectRole } = await getProjectContext(
      user,
      thread.projectId
    );

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
        threadId: options.threadId,
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
      }

      await logActivity({
        userId: user.id,
        action: "TASK_CREATED",
        entity: "TASK",
        entityId: task.id,
        projectId: thread.projectId,
      });

      return task;
    });
  }

  async getTasksForUser(
  user: AuthUser,
  pagination: {
    page: number;
    limit: number;
    sortBy?: string;
    order?: string;
  }
) {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const baseSelect = {
    id: tasks.id,
    title: tasks.title,
    description: tasks.description,
    status: tasks.taskStatus,
    threadId: tasks.threadId,
  };

  let query;
  let whereClause;

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
      .innerJoin(projectThreads, eq(tasks.threadId, projectThreads.id))
      .innerJoin(projects, eq(projectThreads.projectId, projects.id));
    
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

  // Execute the main query
  const data = await query
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .innerJoin(
      user.systemRole === "admin" ? projectThreads : 
      user.systemRole === "user" ? taskAssignees : sql``,
      user.systemRole === "admin" ? eq(tasks.threadId, projectThreads.id) :
      user.systemRole === "user" ? eq(tasks.id, taskAssignees.taskId) : sql``
    )
    .where(whereClause);

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
  
  // GET TASK BY ID
  
  async getTaskById(taskId: number, user: AuthUser) {

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, task.threadId),
    });

    const { project, projectRole } = await getProjectContext(
      user,
      thread!.projectId
    );

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access");
    }

    return task;
  }

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
  const { page, limit, sortBy, order } = pagination;
  const offset = (page - 1) * limit;

  // 1️⃣ Get thread with access check
  const thread = await db.query.projectThreads.findFirst({
    where: eq(projectThreads.id, threadId),
  });

  if (!thread || thread.isDeleted) {
    throw new ApiError(404, "Thread not found");
  }

  // 2️⃣ Project context & access check
  const { project, projectRole } = await getProjectContext(user, thread.projectId);
  
  if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
    throw new ApiError(403, "No access");
  }

  const selectFields = {
    id: tasks.id,
    title: tasks.title,
    description: tasks.description,
    status: tasks.taskStatus,
    createdUser: tasks.createdUser,
  };

  // Build where clause
  const whereConditions = [eq(tasks.threadId, threadId), eq(tasks.isDeleted, false)];
  if (user.systemRole === "user") {
    whereConditions.push(eq(taskAssignees.userId, user.id));
  }
  const whereClause = and(...whereConditions);

  // Build main query
  let mainQuery: any = db.select(selectFields).from(tasks);
  if (user.systemRole === "user") {
    mainQuery = mainQuery.innerJoin(taskAssignees, eq(tasks.id, taskAssignees.taskId));
  }

  // Add sorting with explicit column mapping
  if (sortBy && order) {
    // Create a mapping of sortable fields to actual columns
    const sortableColumns: Record<string, any> = {
      id: tasks.id,
      title: tasks.title,
      status: tasks.taskStatus,
      createdUser: tasks.createdUser,
    };
    
    const column = sortableColumns[sortBy];
    if (column) {
      mainQuery = mainQuery.orderBy(order === 'desc' ? desc(column) : asc(column));
    }
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

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(countResult[0]?.count) || 0,
      totalPages: Math.ceil((Number(countResult[0]?.count) || 0) / limit)
    }
  };
}
  
  // UPDATE TASK
  
  async updateTask(taskId: number, data: any, user: AuthUser) {

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, task.threadId),
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
      projectId: thread!.projectId
    });

    return updated;
  }

  async updateTaskStatus(
  taskId: number,
  status: string,
  user: AuthUser
) {

  // 1️⃣ Get task
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task || task.isDeleted) {
    throw new ApiError(404, "Task not found");
  }

  // 2️⃣ Get thread
  const thread = await db.query.projectThreads.findFirst({
    where: eq(projectThreads.id, task.threadId),
  });

  if (!thread) {
    throw new ApiError(404, "Thread not found");
  }

  // 3️⃣ Project context
  const { project, projectRole } = await getProjectContext(
    user,
    thread.projectId
  );

  // 4️⃣ Access
  if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
    throw new ApiError(403, "No access");
  }

  // 5️⃣ Permission
  if (!hasPermission({
    user,
    action: ACTIONS.UPDATE_TASK,
    project,
    projectRole,
    resource: task
  })) {
    throw new ApiError(403, "Not allowed to update task status");
  }

  // 6️⃣ Update status
  const [updated] = await db.update(tasks)
    .set({
      taskStatus: status,
      updatedAt: new Date()
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return updated;
}

  
  // DELETE TASK
  
  async deleteTask(taskId: number, user: AuthUser) {

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, task.threadId),
    });

    const { project, projectRole } = await getProjectContext(
      user,
      thread!.projectId
    );

    if (!canAccessProject(user,{ ...project, createdBy: project.createdBy! }, projectRole)) {
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
      projectId: thread!.projectId
    });

    return { success: true };
  }
}

export const taskService = new TaskService();