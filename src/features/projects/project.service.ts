import { eq, isNull, and, sql, count } from "drizzle-orm";
import { db } from "../../db";
import { projectUsers, roles } from "../../db/schema";
import { projects } from "../../db/schema/projects";
import { ApiError } from "../../utils/ApiError";

class ProjectService {
  async createProject(options: {
  title: string;
  description?: string;
  createdBy: number;
  members?: { userId: number; roleName: string }[];
}) {
  return await db.transaction(async (tx) => {

    const [project] = await tx
      .insert(projects)
      .values({
        title: options.title,
        description: options.description ?? null,
        createdBy: options.createdBy,
      })
      .returning();

    if (options.members?.length) {

      const uniqueUserIds = new Set<number>();

      for (const member of options.members) {

        if (uniqueUserIds.has(member.userId)) {
          throw new ApiError(400, "Duplicate users in members list");
        }

        uniqueUserIds.add(member.userId);

        const [role] = await tx
          .select()
          .from(roles)
          .where(eq(roles.name, member.roleName));

        if (!role) {
          throw new ApiError(400, `Role ${member.roleName} not found`);
        }

        await tx.insert(projectUsers).values({
          projectId: project.id,
          userId: member.userId,
          roleId: role.id,
          readAccess: true,
          writeAccess: false,
          updateAccess: false,
          deleteAccess: false,
        });
      }
    }

    return project;
  });
}

  async assignUserToProject(options: {
    projectId: number;
    userId: number;
    roleName: string;
  }) {
    return await db.transaction(async (tx) => {
      const [role] = await tx
        .insert(roles)
        .values({
          name: options.roleName,
        })
        .returning();

      if (!role) {
        throw new ApiError(500, "Role creation failed");
      }

      const existing = await tx
        .select()
        .from(projectUsers)
        .where(
          and(
            eq(projectUsers.projectId, options.projectId),
            eq(projectUsers.userId, options.userId),
          ),
        );

      if (existing.length > 0) {
        throw new ApiError(400, "User already assigned to this project");
      }

      await tx.insert(projectUsers).values({
        projectId: options.projectId,
        userId: options.userId,
        roleId: role.id,
        readAccess: true,
        writeAccess: false,
        updateAccess: false,
        deleteAccess: false,
      });

      return true;
    });
  }


async listProjects(
  userId: number,
  systemRole: string,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;
  const isAdmin =
    systemRole === "admin" || systemRole === "super_admin";

  if (isAdmin) {
    const data = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
      })
      .from(projects)
      .where(isNull(projects.deletedAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(projects)
      .where(isNull(projects.deletedAt));

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

  // Non-admin
  const data = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
    })
    .from(projects)
    .innerJoin(projectUsers, eq(projects.id, projectUsers.projectId))
    .where(
      and(
        eq(projectUsers.userId, userId),
        isNull(projects.deletedAt)
      )
    )
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(projects)
    .innerJoin(projectUsers, eq(projects.id, projectUsers.projectId))
    .where(
      and(
        eq(projectUsers.userId, userId),
        isNull(projects.deletedAt)
      )
    );

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

  async getProjectDetails(
    projectId: number,
    userId: number,
    systemRole: string,
  ) {
    const isAdmin = systemRole === "admin" || systemRole === "super_admin";

    const conditions = [eq(projects.id, projectId), isNull(projects.deletedAt)];

    if (!isAdmin) {
      conditions.push(eq(projectUsers.userId, userId));
    }

    const result = await db
      .select()
      .from(projects)
      .leftJoin(projectUsers, eq(projects.id, projectUsers.projectId))
      .where(and(...conditions));

    const [project] = result;

    if (!project) {
      throw new ApiError(404, "Project not found or access denied");
    }

    return project;
  }

  async updateProject(
    projectId: number,
    data: { title?: string; description?: string },
  ) {
    const [project] = await db
      .update(projects)
      .set({
        title: data.title,
        description: data.description,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
      .returning();

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    return project;
  }

  async deleteProject(projectId: number, userId: number) {
    const result = await db
      .update(projects)
      .set({
        deletedAt: new Date(),
        deletedBy: userId,
      })
      .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
      .returning();

    if (result.length === 0) {
      throw new ApiError(404, "Project not found");
    }

    return true;
  }

  async removeProjectMember(
    projectId: number,
    userId: number,
    systemRole: string,
  ) {
    const isAdmin = systemRole === "admin" || systemRole === "super_admin";

    if (!isAdmin) {
      throw new ApiError(403, "Not allowed to remove members");
    }

    const result = await db
      .delete(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, projectId),
          eq(projectUsers.userId, userId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new ApiError(404, "Member not found");
    }

    return true;
  }
}

export const projectService = new ProjectService();
