import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { projectThreads } from "../../db/schema/projectThreads";
import { tasks } from "../../db/schema/tasks";
import { ApiError } from "../../utils/ApiError";
import { projectUsers, roles } from "../../db/schema";
import { PROJECT_ROLES } from "../../constants/projectRoles";

class TaskService{


    async createTask({
        threadId,
        title,
        description,
        gitLink,
        targetDate,
        userId,
        systemRole
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

        if(systemRole === "admin" || systemRole === "super_admin"){
            const [task] = await db.insert(tasks).values({
                threadId,
                title,
                description,
                gitLink,
                targetDate,
                createdUser: userId,
            }).returning();

            return task;
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

        if(membership.roleId !==  PROJECT_ROLES.PROJECT_ADMIN){
    throw new ApiError(403, "Only project admin can create tasks")
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

 async getThreadTasksService(
  threadId: number,
  userId: number,
  systemRole: string,
  pagination: any,
  query: any
) {
  const { page, limit, offset, sortBy, order } = pagination;
  const { status } = query;

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
    sortOptions[sortBy as keyof typeof sortOptions] || tasks.createdAt;

  const whereClause = and(
    eq(tasks.threadId, threadId),
    eq(tasks.isDeleted, false),
    status ? eq(tasks.taskStatus, status) : undefined
  );


  const data = await db.query.tasks.findMany({
    where: whereClause,
    limit,
    offset,
    orderBy: (t, { asc, desc }) =>
      order === "asc" ? asc(sortColumn) : desc(sortColumn),
  });

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(whereClause);

  const total = Number(totalResult[0]?.count || 0);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

    async getTaskByIdService(taskId: number, userId: number, systemRole: string) {

  
    const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });

  if (!task || task.isDeleted) {
    throw new ApiError(404, "Task not found");
  }

  if(systemRole === "admin" || systemRole === "super_admin"){
    return task;
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

    async updateTask(title: string,
        description: string,
        gitLink: string,
        targetDate: any,
        userId: number,
        systemRole: string,
        taskId: number){
        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId)
        })

        if(systemRole === "admin" || systemRole === "super_admin"){
            const [updatedTask] = await db.update(tasks).set({
                title,
                description,
                gitLink,
                targetDate,
                updatedAt: new Date()
            }).where(eq(tasks.id, taskId)).returning();

            return updatedTask;
        }

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
            title,
                description,
                gitLink,
                targetDate,
                updatedAt: new Date()
        })
        .where(eq(tasks.id, taskId))
        .returning();

        return updatedTask;
    }

    async updateTaskStatus(taskId: number, status: string, userId: number, systemRole: string){

        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId)
        })

        if(systemRole === "admin" || systemRole === "super_admin"){
            return await db.update(tasks).set({
            taskStatus: status,
            updatedAt: new Date()
        }).where(eq(tasks.id, taskId)).returning();
        }

        if(!task || task.isDeleted){
            throw new ApiError(404, "Task not found");
        }
        const thread =  await db.query.projectThreads.findFirst({
            where: eq(projectThreads.id, task.threadId)
        });

        if(!thread){
            throw new ApiError(404, "Thread not found");
        }

        const membership = await db.query.projectUsers.findFirst({
            where:
                and(
                    eq(projectUsers.projectId, thread.projectId),
                    eq(projectUsers.userId, userId)
                )
            
        })

        if(!membership?.updateAccess){
            throw new ApiError(403, "User cannot update task status");
        }

        return await db.update(tasks).set({
            taskStatus: status,
            updatedAt: new Date()
        }).where(eq(tasks.id, taskId)).returning();
    }

    async deleteTask(taskId: number, userId: number, systemRole: string){
        if(systemRole === "admin" || systemRole === "super_admin"){
            await db.update(tasks).set({
                isDeleted: true
            }).where(eq(tasks.id, taskId));

            return {success: true};
        }
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