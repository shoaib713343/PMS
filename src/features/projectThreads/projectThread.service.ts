import { and, eq, or, sql } from "drizzle-orm";
import { db } from "../../db";

import { projectThreads } from "../../db/schema/projectThreads";
import { projectUsers } from "../../db/schema/projectUsers";

import { ApiError } from "../../utils/ApiError";
import { PROJECT_ROLES } from "../../constants/projectRoles";
import { projects } from "../../db/schema";

class ThreadService {

  async createThread({topic,
  description,
  priority,
  assignUserId,
  dueDate,
  projectId,
  userId,
  systemRole}: any) {

    if (systemRole === "admin" || systemRole === "super_admin") {

    const [thread] = await db.insert(projectThreads)
      .values({
        topic,
        description,
        priority,
        assignUserId,
        dueDate,
        projectId,
        createdUser: userId
      })
      .returning();

    return thread;
  }

    const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, projectId),
        eq(projectUsers.userId, userId)
      )
    });

    if (!membership) {
      throw new ApiError(403, "User not part of this project");
    }

    if (!membership.writeAccess) {
      throw new ApiError(403, "No permission to create thread");
    }

    const [thread] = await db
      .insert(projectThreads)
      .values({
        topic,
        description,
        priority,
        assignUserId,
        dueDate,
        projectId,
        createdUser: userId
      })
      .returning();

    return thread;
  }



  async getAllThreads(userId: number, systemRole: string) {

  
  if (systemRole === "admin" || systemRole === "super_admin") {
    return await db
      .select({
        id: projectThreads.id,
        topic: projectThreads.topic,
        projectId: projectThreads.projectId,
        projectName: projects.title,
        assignedTo: projectThreads.assignUserId,
      })
      .from(projectThreads)
      .leftJoin(projects, eq(projectThreads.projectId, projects.id))
      .where(eq(projectThreads.isDeleted, false));
  }

  return await db
    .select({
      id: projectThreads.id,
      topic: projectThreads.topic,
      projectId: projectThreads.projectId,
      projectName: projects.title,
      assignedTo: projectThreads.assignUserId,
    })
    .from(projectThreads)
    .leftJoin(projectUsers, eq(projectThreads.projectId, projectUsers.projectId))
    .leftJoin(projects, eq(projectThreads.projectId, projects.id))
    .where(
      and(
        eq(projectThreads.isDeleted, false),
        or(
          eq(projectUsers.userId, userId),           
          eq(projectThreads.assignUserId, userId)    
        )
      )
    );
}

  async getThreadsByProjectId(projectId: number, userId: number, systemRole: string, pagination: any, query: any) {

    const {page, limit, offset, sortBy, order} = pagination;
    const {status} = query;
    if(!(systemRole === "admin" || systemRole === "super_admin")){
      const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, projectId),
        eq(projectUsers.userId, userId)
      )
    });

    if (!membership || !membership.readAccess) {
      throw new ApiError(403, "No permission to view threads");
    }
    }

    const whereClause =  and(
      eq(projectThreads.projectId, projectId),
      eq(projectThreads.isDeleted, false),
      status ? eq(projectThreads.threadStatus, status) : undefined
    )

    const sortOptions = {
      createdAt: projectThreads.createdAt,
      threadStatus: projectThreads.threadStatus,
      priority: projectThreads.priority
    };

    const sortColumn = sortOptions[sortBy as keyof typeof sortOptions] || projectThreads.createdAt;



    const data = await db.query.projectThreads.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (t, {asc, desc})=> order === "asc" ? asc(sortColumn) : desc(sortColumn)
    })

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(projectThreads).where(whereClause);

    const total = totalResult[0]?.count || 0;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total/limit)
      }
    }
  }



  async getThreadById(threadId: number, userId: number, systemRole: string) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId)
    });

    if (!thread || thread.isDeleted) {
      throw new ApiError(404, "Thread not found");
    }

    if(systemRole === "admin" || systemRole === "super_admin"){
      return thread;
    }

    const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, thread.projectId),
        eq(projectUsers.userId, userId)
      )
    });

    if (!membership || !membership.readAccess) {
      throw new ApiError(403, "No permission");
    }

    return thread;
  }



  async updateThread(threadId: number, data: any, userId: number, systemRole: string) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId)
    });

    if (!thread || thread.isDeleted) {
      throw new ApiError(404, "Thread not found");
    }

    if(systemRole === "admin" || systemRole === "super_admin"){
      const [updatedThread] = await db
      .update(projectThreads)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(projectThreads.id, threadId))
      .returning();

    return updatedThread;
    }

    const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, thread.projectId),
        eq(projectUsers.userId, userId)
      )
    });

    if (!membership || !membership.updateAccess) {
      throw new ApiError(403, "No permission to update thread");
    }

    const [updatedThread] = await db
      .update(projectThreads)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(projectThreads.id, threadId))
      .returning();

    return updatedThread;
  }

  async updateThreadStatus(
  threadId: number,
  status: number,
  userId: number,
  systemRole: string
){

  const thread = await db.query.projectThreads.findFirst({
    where: eq(projectThreads.id, threadId)
  });

  if(!thread){
    throw new ApiError(404, "Thread not found");
  }

  if(systemRole === "admin" || systemRole === "super_admin"){
    const [updated] = await db.update(projectThreads)
      .set({ threadStatus: status })
      .where(eq(projectThreads.id, threadId))
      .returning();

    return updated;
  }

  const membership = await db.query.projectUsers.findFirst({
    where: and(
      eq(projectUsers.projectId, thread.projectId),
      eq(projectUsers.userId, userId)
    )
  });

  if(!membership){
    throw new ApiError(403, "User not part of this project");
  }

  if(membership.roleId !== PROJECT_ROLES.PROJECT_ADMIN){
    throw new ApiError(403, "Only project admin can update thread status");
  }

  const [updated] = await db.update(projectThreads)
    .set({ threadStatus: status })
    .where(eq(projectThreads.id, threadId))
    .returning();

  return updated;
}


  async deleteThread(threadId: number, userId: number, systemRole: string) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId)
    });

    if (!thread || thread.isDeleted) {
      throw new ApiError(404, "Thread not found");
    }

    if(systemRole === "admin" || systemRole === "super_admin"){
       await db
      .update(projectThreads)
      .set({
        isDeleted: true
      })
      .where(eq(projectThreads.id, threadId));

      return;
    }

    const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, thread.projectId),
        eq(projectUsers.userId, userId)
      )
    });

    if (!membership || !membership.deleteAccess) {
      throw new ApiError(403, "No permission to delete thread");
    }

    await db
      .update(projectThreads)
      .set({
        isDeleted: true
      })
      .where(eq(projectThreads.id, threadId));
  }

}

export const threadService = new ThreadService();