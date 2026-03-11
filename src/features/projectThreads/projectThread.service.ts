import { and, eq } from "drizzle-orm";
import { db } from "../../db";

import { projectThreads } from "../../db/schema/projectThreads";
import { projectUsers } from "../../db/schema/projectUsers";

import { ApiError } from "../../utils/ApiError";

class ThreadService {

  async createThread(data: any) {

    const membership = await db.query.projectUsers.findFirst({
      where: and(
        eq(projectUsers.projectId, data.projectId),
        eq(projectUsers.userId, data.userId)
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
        ...data,
        createdUser: data.userId
      })
      .returning();

    return thread;
  }



  async getThreadsByProjectId(projectId: number, userId: number) {

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



  async getThreadById(threadId: number, userId: number) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId)
    });

    if (!thread || thread.isDeleted) {
      throw new ApiError(404, "Thread not found");
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



  async updateThread(threadId: number, data: any, userId: number) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId)
    });

    if (!thread || thread.isDeleted) {
      throw new ApiError(404, "Thread not found");
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



  async deleteThread(threadId: number, userId: number) {

    const thread = await db.query.projectThreads.findFirst({
      where: eq(projectThreads.id, threadId)
    });

    if (!thread || thread.isDeleted) {
      throw new ApiError(404, "Thread not found");
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