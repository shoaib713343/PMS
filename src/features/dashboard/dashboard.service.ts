import { db } from "../../db";
import {
  projects,
  projectUsers,
  projectThreads,
  tasks,
  taskAssignees,
  messages as messagesTable,
  users,
} from "../../db/schema";


import { eq, desc, inArray } from "drizzle-orm";
import { activityLogs } from "../../db/schema/activityLogs";

export const getDashboardData = async (
  userId: number,
  systemRole: string
) => {
  //  SUPER ADMIN → full access
  if (systemRole === "super_admin") {
    const [allProjects, allTasks, allActivity, allThreads, allMessages] =
      await Promise.all([
        db.select().from(projects),

        db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(10),

        db
          .select()
          .from(activityLogs)
          .orderBy(desc(activityLogs.createdAt))
          .limit(10),

        db
          .select()
          .from(projectThreads)
          .orderBy(desc(projectThreads.createdAt))
          .limit(5),

        db
          .select({
            id: messagesTable.id,
            content: messagesTable.content,
            createdAt: messagesTable.createdAt,
            userName: users.firstName,
          })
          .from(messagesTable)
          .leftJoin(users, eq(users.id, messagesTable.userId))
          .orderBy(desc(messagesTable.createdAt))
          .limit(5),
      ]);

    return {
      projects: allProjects,
      tasks: allTasks,
      activity: allActivity,
      threads: allThreads,
      messages: allMessages,
    };
  }

  // 🟡 ADMIN + USER → limited access

  // 1. Get projectIds of user
  const userProjects = await db
    .select({ projectId: projectUsers.projectId })
    .from(projectUsers)
    .where(eq(projectUsers.userId, userId));

  const projectIds = userProjects.map((p) => p.projectId);

  if (projectIds.length === 0) {
    return {
      projects: [],
      tasks: [],
      activity: [],
      threads: [],
      messages: [],
    };
  }

  // 2. Fetch everything in parallel
  const [projectsData, tasksData, activityData, threadsData, messagesData] =
    await Promise.all([
      // Projects
      db
        .select()
        .from(projects)
        .where(inArray(projects.id, projectIds)),

      // Tasks (assigned to user OR project tasks)
      db
        .select()
        .from(tasks)
        .orderBy(desc(tasks.createdAt))
        .limit(10),

      // Activity
      db
        .select()
        .from(activityLogs)
        .where(inArray(activityLogs.projectId, projectIds))
        .orderBy(desc(activityLogs.createdAt))
        .limit(10),

      // Threads
      db
        .select()
        .from(projectThreads)
        .where(inArray(projectThreads.projectId, projectIds))
        .orderBy(desc(projectThreads.createdAt))
        .limit(5),

      // Messages
      db
        .select({
          id: messagesTable.id,
          content: messagesTable.content,
          createdAt: messagesTable.createdAt,
          userName: users.firstName,
        })
        .from(messagesTable)
        .leftJoin(users, eq(users.id, messagesTable.userId))
        .innerJoin(
          projectThreads,
          eq(projectThreads.id, messagesTable.threadId)
        )
        .where(inArray(projectThreads.projectId, projectIds))
        .orderBy(desc(messagesTable.createdAt))
        .limit(5),
    ]);

  return {
    projects: projectsData,
    tasks: tasksData,
    activity: activityData,
    threads: threadsData,
    messages: messagesData,
  };
};