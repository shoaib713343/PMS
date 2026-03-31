import {
  and,
  eq,
  or,
  asc,
  desc,
  count,
  exists,
} from "drizzle-orm";

import { db } from "../../db";
import { projectThreads } from "../../db/schema/projectThreads";
import { tasks } from "../../db/schema/tasks";
import { projectUsers } from "../../db/schema";
import { taskAssignees } from "../../db/schema/taskAssignees";
import { ApiError } from "../../utils/ApiError";
import { PROJECT_ROLES } from "../../constants/projectRoles";

class TaskService {

  async createTask(options: any) {
    const {
      threadId,
      title,
      description,
      gitLink,
      targetDate,
      userId,
      systemRole,
      assignedUserIds,
    } = options;

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId),
    });

    if (!thread || thread.isDeleted) {
      throw new ApiError(404, "Thread not found");
    }

    if (thread.threadStatus === 4) {
      throw new ApiError(400, "Thread is closed");
    }

    if (!(systemRole === "admin" || systemRole === "super_admin")) {
      const membership = await db.query.projectUsers.findFirst({
        where: and(
          eq(projectUsers.projectId, thread.projectId),
          eq(projectUsers.userId, userId)
        ),
      });

      if (!membership) {
        throw new ApiError(403, "You are not a member of this project");
      }

      if (membership.roleId !== PROJECT_ROLES.PROJECT_ADMIN) {
        throw new ApiError(403, "Only project admin can create tasks");
      }
    }

    return db.transaction(async (tx) => {
      const [task] = await tx.insert(tasks).values({
        threadId,
        title,
        description,
        gitLink,
        targetDate,
        createdUser: userId,
      }).returning();

      if (assignedUserIds?.length) {
        await tx.insert(taskAssignees).values(
          assignedUserIds.map((uId: number) => ({
            taskId: task.id,
            userId: uId,
          }))
        );
      }

      return task;
    });
  }

  async assignUsersToTask(taskId: number, userIds: number[]) {
    if (!userIds?.length) {
      throw new ApiError(400, "User IDs required");
    }

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    await db.delete(taskAssignees)
      .where(eq(taskAssignees.taskId, taskId));

    await db.insert(taskAssignees).values(
      userIds.map((userId) => ({
        taskId,
        userId,
      }))
    );

    return true;
  }

  async removeUserFromTask(taskId: number, userId: number) {
    await db.delete(taskAssignees).where(
      and(
        eq(taskAssignees.taskId, taskId),
        eq(taskAssignees.userId, userId)
      )
    );

    return true;
  }

  async getTasksForUser(userId: number, systemRole: string, pagination: any) {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = pagination;

    const safeLimit = Math.min(limit, 50);
    const offset = (page - 1) * safeLimit;

    const isAdmin =
      systemRole === "admin" || systemRole === "super_admin";

    const sortOptions = {
      createdAt: tasks.createdAt,
      title: tasks.title,
      targetDate: tasks.targetDate,
      taskStatus: tasks.taskStatus,
    };

    const sortColumn =
      sortOptions[sortBy as keyof typeof sortOptions] ||
      tasks.createdAt;

    const assignmentFilter = exists(
      db
        .select()
        .from(taskAssignees)
        .where(
          and(
            eq(taskAssignees.taskId, tasks.id),
            eq(taskAssignees.userId, userId)
          )
        )
    );

    const projectAccessFilter = exists(
      db
        .select()
        .from(projectThreads)
        .innerJoin(
          projectUsers,
          eq(projectUsers.projectId, projectThreads.projectId)
        )
        .where(
          and(
            eq(projectThreads.id, tasks.threadId),
            eq(projectUsers.userId, userId)
          )
        )
    );

    const userFilter = or(assignmentFilter, projectAccessFilter);

    const baseCondition = isAdmin
      ? eq(tasks.isDeleted, false)
      : and(eq(tasks.isDeleted, false), userFilter);

    const data = await db
      .select()
      .from(tasks)
      .where(baseCondition)
      .orderBy(order === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(safeLimit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(tasks)
      .where(baseCondition);

    return {
      data,
      pagination: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getThreadTasksService(
    threadId: number,
    userId: number,
    systemRole: string,
    pagination: any,
    query: any
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = pagination;

    const { status } = query;

    const safeLimit = Math.min(limit, 50);
    const offset = (page - 1) * safeLimit;

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId),
    });

    if (!thread) {
      throw new ApiError(404, "Thread not found");
    }

    if (!(systemRole === "admin" || systemRole === "super_admin")) {
      const membership = await db.query.projectUsers.findFirst({
        where: and(
          eq(projectUsers.projectId, thread.projectId),
          eq(projectUsers.userId, userId)
        ),
      });

      if (!membership || !membership.readAccess) {
        throw new ApiError(403, "No permission to view tasks");
      }
    }

    const sortOptions = {
      createdAt: tasks.createdAt,
      taskStatus: tasks.taskStatus,
      title: tasks.title,
    };

    const sortColumn =
      sortOptions[sortBy as keyof typeof sortOptions] ||
      tasks.createdAt;

    const whereClause = and(
      eq(tasks.threadId, threadId),
      eq(tasks.isDeleted, false),
      status ? eq(tasks.taskStatus, status) : undefined
    );

    const data = await db
      .select()
      .from(tasks)
      .where(whereClause)
      .orderBy(order === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(safeLimit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(tasks)
      .where(whereClause);

    return {
      data,
      pagination: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getTaskByIdService(taskId: number, userId: number, systemRole: string) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    if (systemRole === "admin" || systemRole === "super_admin") {
      return task;
    }

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, task.threadId),
    });

    if (!thread) {
      throw new ApiError(404, "Thread not found");
    }

    const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, thread.projectId),
        eq(projectUsers.userId, userId)
      ),
    });

    if (!membership || !membership.readAccess) {
      throw new ApiError(403, "No permission");
    }

    return task;
  }

  async updateTask(
    title: string,
    description: string,
    gitLink: string,
    targetDate: any,
    userId: number,
    systemRole: string,
    taskId: number,
    status?: string
  ) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    if (systemRole === "admin" || systemRole === "super_admin") {
      return await db.update(tasks)
        .set({ title, description, gitLink, targetDate, updatedAt: new Date(), taskStatus: status })
        .where(eq(tasks.id, taskId))
        .returning();
    }

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, task.threadId),
    });

    const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, thread!.projectId),
        eq(projectUsers.userId, userId)
      ),
    });

    if (!membership?.updateAccess) {
      throw new ApiError(403, "User cannot update tasks");
    }

    return await db.update(tasks)
      .set({ title, description, gitLink, targetDate, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();
  }

  async updateTaskStatus(
    taskId: number,
    status: string,
    userId: number,
    systemRole: string
  ) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    if (systemRole === "admin" || systemRole === "super_admin") {
      return await db.update(tasks)
        .set({ taskStatus: status, updatedAt: new Date() })
        .where(eq(tasks.id, taskId))
        .returning();
    }

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, task.threadId),
    });

    const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, thread!.projectId),
        eq(projectUsers.userId, userId)
      ),
    });

    if (!membership?.updateAccess) {
      throw new ApiError(403, "User cannot update task status");
    }

    return await db.update(tasks)
      .set({ taskStatus: status, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();
  }

  async deleteTask(taskId: number, userId: number, systemRole: string) {
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found");
    }

    if (systemRole === "admin" || systemRole === "super_admin") {
      await db.update(tasks)
        .set({ isDeleted: true })
        .where(eq(tasks.id, taskId));

      return { success: true };
    }

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, task.threadId),
    });

    const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, thread!.projectId),
        eq(projectUsers.userId, userId)
      ),
    });

    if (!membership?.deleteAccess) {
      throw new ApiError(403, "User cannot delete tasks");
    }

    await db.update(tasks)
      .set({ isDeleted: true })
      .where(eq(tasks.id, taskId));

    return { success: true };
  }
}

export const taskService = new TaskService();