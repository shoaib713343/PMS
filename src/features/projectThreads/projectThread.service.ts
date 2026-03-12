import { and, eq } from "drizzle-orm";
import { db } from "../../db";

import { projectThreads } from "../../db/schema/projectThreads";
import { projectUsers } from "../../db/schema/projectUsers";

import { ApiError } from "../../utils/ApiError";
import { PROJECT_ROLES } from "../../constants/projectRoles";

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



  async getThreadsByProjectId(projectId: number, userId: number, systemRole: string) {

    if(systemRole === "admin" || systemRole === "super_admin"){
    return db.select()
      .from(projectThreads)
      .where(and(
        eq(projectThreads.projectId, projectId),
        eq(projectThreads.isDeleted, false)
      ));
  }

    const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, projectId),
        eq(projectUsers.userId, userId)
      )
    });

    if (!membership || !membership.readAccess) {
      throw new ApiError(403, "No permission to view threads");
    }

    return db
      .select()
      .from(projectThreads)
      .where(
        and(
          eq(projectThreads.projectId, projectId),
          eq(projectThreads.isDeleted, false)
        )
      );
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