import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";

import { projectThreads } from "../../db/schema/projectThreads";
import { projects, tasks } from "../../db/schema";

import { ApiError } from "../../utils/ApiError";

import { getProjectContext } from "../../utils/getProjectContext";
import { canAccessProject } from "../../utils/projectAccess";
import { hasPermission } from "../../utils/permission";
import { ACTIONS } from "../../constants/actions";

type AuthUser = {
  id: number;
  systemRole: "admin" | "user" | "super_admin";
};

class ThreadService {

  // CREATE THREAD
  async createThread(data: any, user: AuthUser) {

    const { project, projectRole } = await getProjectContext(
      user,
      data.projectId
    );

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access to project");
    }

    if (!hasPermission({
      user,
      action: ACTIONS.CREATE_THREAD,
      project,
      projectRole
    })) {
      throw new ApiError(403, "Not allowed to create thread");
    }

    const [thread] = await db.insert(projectThreads)
      .values({
        ...data,
        createdUser: user.id
      })
      .returning();

    return thread;
  }

  // GET ALL THREADS
  async getAllThreads(user: AuthUser) {

    if (user.systemRole === "super_admin") {
      return db.select({
        id: projectThreads.id,
        topic: projectThreads.topic,
        projectId: projectThreads.projectId,
        projectName: projects.title,
      })
      .from(projectThreads)
      .leftJoin(projects, eq(projectThreads.projectId, projects.id))
      .where(eq(projectThreads.isDeleted, false));
    }

    if (user.systemRole === "admin") {
      return db.select({
        id: projectThreads.id,
        topic: projectThreads.topic,
        projectId: projectThreads.projectId,
        projectName: projects.title,
      })
      .from(projectThreads)
      .leftJoin(projects, eq(projectThreads.projectId, projects.id))
      .where(
        and(
          eq(projectThreads.isDeleted, false),
          eq(projects.createdBy, user.id)
        )
      );
    }

    // user → only project member threads
    return db.select({
      id: projectThreads.id,
      topic: projectThreads.topic,
      projectId: projectThreads.projectId,
      projectName: projects.title,
    })
    .from(projectThreads)
    .leftJoin(projects, eq(projectThreads.projectId, projects.id))
    .leftJoin(
      projectThreads,
      eq(projectThreads.projectId, projectThreads.projectId)
    )
    .where(eq(projectThreads.isDeleted, false));
  }

  // GET THREADS BY PROJECT


async getThreadsByProjectId(
  projectId: number,
  user: AuthUser,
  pagination: any,
  query: any
) {
  const { project, projectRole } = await getProjectContext(user, projectId);

  if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
    throw new ApiError(403, "No access");
  }

  const { page, limit, offset, sortBy, order } = pagination;
  const { status } = query;

  const whereClause = and(
    eq(projectThreads.projectId, projectId),
    eq(projectThreads.isDeleted, false),
    status ? eq(projectThreads.threadStatus, status) : undefined
  );

  // Add orderBy
  let orderByClause: any;
  if (sortBy === 'createdAt') {
    orderByClause = order === 'desc' ? desc(projectThreads.createdAt) : asc(projectThreads.createdAt);
  } else {
    orderByClause = desc(projectThreads.createdAt);
  }

  const data = await db.query.projectThreads.findMany({
    where: whereClause,
    limit,
    offset,
    orderBy: orderByClause
  });

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(projectThreads)
    .where(whereClause);

  const total = totalResult[0]?.count || 0;

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

  // ======================
  // GET THREAD BY ID
  // ======================
  async getThreadById(threadId: number, user: AuthUser) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId)
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

    return thread;
  }

  // ======================
  // UPDATE THREAD
  // ======================
  async updateThread(threadId: number, data: any, user: AuthUser) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId)
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
      action: ACTIONS.UPDATE_THREAD,
      project,
      projectRole,
      resource: thread
    })) {
      throw new ApiError(403, "Not allowed");
    }

    const [updated] = await db.update(projectThreads)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(projectThreads.id, threadId))
      .returning();

    return updated;
  }

  // ======================
  // DELETE THREAD
  // ======================
  // projectThread.service.ts - Update deleteThread method

async deleteThread(threadId: number, user: AuthUser) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId)
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
      action: ACTIONS.DELETE_THREAD,
      project,
      projectRole,
      resource: thread
    })) {
      throw new ApiError(403, "Not allowed");
    }

    // ✅ FIRST: Delete all tasks associated with this thread
    await db.update(tasks)
  .set({ 
    isDeleted: true, 
  })
  .where(eq(tasks.threadId, threadId));
    
    // ✅ SECOND: Delete (soft delete) the thread
    await db.update(projectThreads)
      .set({ 
        isDeleted: true,
      })
      .where(eq(projectThreads.id, threadId));
}

  // ======================
  // UPDATE THREAD STATUS

  async updateThreadStatus(
  threadId: number,
  status: number,
  user: AuthUser
) {

  const thread = await db.query.projectThreads.findFirst({
    where: eq(projectThreads.id, threadId),
  });

  if (!thread || thread.isDeleted) {
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

  // Permission (reuse UPDATE_THREAD)
  if (!hasPermission({
    user,
    action: ACTIONS.UPDATE_THREAD,
    project,
    projectRole,
    resource: thread
  })) {
    throw new ApiError(403, "Not allowed to update thread status");
  }

  const [updated] = await db.update(projectThreads)
    .set({
      threadStatus: status,
      updatedAt: new Date()
    })
    .where(eq(projectThreads.id, threadId))
    .returning();

  return updated;
}
}

export const threadService = new ThreadService();