import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { projectThreads } from "../../db/schema/projectThreads";
import { tasks } from "../../db/schema/tasks";
import { ApiError } from "../../utils/ApiError";
import { projectUsers } from "../../db/schema";

class TaskService{


    async createTask({
        threadId,
        title,
        description,
        gitLink,
        targetDate,
        userId
    }:any) {
        const thread = await db.query.projectThreads.findFirst({
            where: eq(projectThreads.id, threadId)
        })

        if(!thread || thread.isDeleted){
            throw new ApiError(404, "Thread not found");
        }

        if(thread.threadStatus === 4){
            throw new ApiError(400, "Thread is closed");
        }

        const membership = await db.query.projectUsers.findFirst({
            where: and(
                eq(projectUsers.projectId, thread.projectId),
                eq(projectUsers.userId, userId)
            )
        })
        if(!membership){
            throw new ApiError(403, "You are not a member of this poject")
        }
        if(!membership.writeAccess){
            throw new ApiError(403, "User cannot create tasks")
        }

        const [task] = await db.insert(tasks)
            .values({
                threadId,
                title,
                description,
                gitLink,
                targetDate,
                createdUser: userId
            })
            .returning();

            return task;
    }

    async getThreadTasksService(threadId: number, userId: number){

  const thread = await db.query.projectThreads.findFirst({
    where: eq(projectThreads.id, threadId)
  });

  if (!thread) {
    throw new ApiError(404, "Thread not found");
  }

  const membership = await db.query.projectUsers.findFirst({
    where: and(
      eq(projectUsers.projectId, thread.projectId),
      eq(projectUsers.userId, userId)
    )
  });

  if (!membership || !membership.readAccess) {
    throw new ApiError(403, "No permission to view tasks");
  }

  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.threadId, threadId),
        eq(tasks.isDeleted, false)
      )
    );
};

    async getTaskByIdService(taskId: number, userId: number){

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });

  if (!task || task.isDeleted) {
    throw new ApiError(404, "Task not found");
  }

  const thread = await db.query.projectThreads.findFirst({
    where: eq(projectThreads.id, task.threadId)
  });

  if(!thread){
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

  return task;
};

    async updateTask(taskId: number, data: any, userId: number){
        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId)
        })

        if(!task || task.isDeleted){
            throw new ApiError(404, "Task not found");
        }

        const thread = await db.query.projectThreads.findFirst({
            where: eq(projectThreads.id, task.threadId)
        })

        if(!thread){
            throw new ApiError(404, "Thread not found");
        }

        const membership = await db.query.projectUsers.findFirst({
            where: and(
                eq(projectUsers.projectId, thread.projectId),
                eq(projectUsers.userId, userId)
            )
        })

        if(!membership?.updateAccess){
            throw new ApiError(403, "User cannot update tasks");
        }

        const [updatedTask] =  await db.update(tasks).set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(tasks.id, taskId))
        .returning();

        return updatedTask;
    }

    async deleteTask(taskId: number, userId: number){
        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId)
        })

        if(!task || task.isDeleted){
            throw new ApiError(404, "Task not found");
        }

        const thread = await db.query.projectThreads.findFirst({
            where: eq(projectThreads.id, task.threadId)
        })

        if(!thread){
            throw new ApiError(404, "Thread not found");
        }

        const membership = await db.query.projectUsers.findFirst({
            where: and(
                eq(projectUsers.projectId, thread.projectId),
                eq(projectUsers.userId, userId)
            )
        })
        if(!membership?.deleteAccess){
            throw new ApiError(403, "User cannot delete tasks");
        }
        await db.update(tasks).set({
            isDeleted: true
        }).where(eq(tasks.id, taskId));

        return {success: true};
    }

}

export const taskService = new TaskService();