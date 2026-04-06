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

  // =========================
  // 👑 SUPER ADMIN
  // =========================
  if (systemRole === "super_admin") {
    const [allProjects, allTasks, allActivity, allThreads, allMessages] =
      await Promise.all([
        db.select().from(projects),

        db.select().from(tasks)
          .orderBy(desc(tasks.createdAt))
          .limit(10),

        db.select().from(activityLogs)
          .orderBy(desc(activityLogs.createdAt))
          .limit(10),

        db.select().from(projectThreads)
          .orderBy(desc(projectThreads.createdAt))
          .limit(5),

        db.select({
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

  // =========================
  // 🧑‍💼 ADMIN → OWN PROJECTS
  // =========================
  if (systemRole === "admin") {

    const adminProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.createdBy, userId));

    const projectIds = adminProjects.map(p => p.id);

    if (projectIds.length === 0) {
      return emptyDashboard();
    }

    const [projectsData, tasksData, activityData, threadsData, messagesData] =
      await Promise.all([

        db.select().from(projects)
          .where(inArray(projects.id, projectIds)),

        db.select().from(tasks)
          .innerJoin(projectThreads, eq(tasks.threadId, projectThreads.id))
          .where(inArray(projectThreads.projectId, projectIds))
          .orderBy(desc(tasks.createdAt))
          .limit(10),

        db.select().from(activityLogs)
          .where(inArray(activityLogs.projectId, projectIds))
          .orderBy(desc(activityLogs.createdAt))
          .limit(10),

        db.select().from(projectThreads)
          .where(inArray(projectThreads.projectId, projectIds))
          .orderBy(desc(projectThreads.createdAt))
          .limit(5),

        db.select({
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
  }

  // =========================
  // 👤 USER → ASSIGNED PROJECTS
  // =========================

  const userProjects = await db
    .select({ projectId: projectUsers.projectId })
    .from(projectUsers)
    .where(eq(projectUsers.userId, userId));

  const projectIds = userProjects.map(p => p.projectId);

  if (projectIds.length === 0) {
    return emptyDashboard();
  }

  const [projectsData, tasksData, activityData, threadsData, messagesData] =
    await Promise.all([

      db.select().from(projects)
        .where(inArray(projects.id, projectIds)),

      db.select().from(tasks)
        .innerJoin(taskAssignees, eq(tasks.id, taskAssignees.taskId))
        .where(eq(taskAssignees.userId, userId))
        .orderBy(desc(tasks.createdAt))
        .limit(10),

      db.select().from(activityLogs)
        .where(inArray(activityLogs.projectId, projectIds))
        .orderBy(desc(activityLogs.createdAt))
        .limit(10),

      db.select().from(projectThreads)
        .where(inArray(projectThreads.projectId, projectIds))
        .orderBy(desc(projectThreads.createdAt))
        .limit(5),

      db.select({
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


// 🔥 helper
function emptyDashboard() {
  return {
    projects: [],
    tasks: [],
    activity: [],
    threads: [],
    messages: [],
  };
}