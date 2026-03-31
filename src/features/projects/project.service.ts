import { eq, isNull, and, sql, count, desc, asc } from "drizzle-orm";
import { db } from "../../db";
import { projectUsers, roles, users } from "../../db/schema";
import { projects } from "../../db/schema/projects";
import { ApiError } from "../../utils/ApiError";

class ProjectService {
  async createProject(options: {
  title: string;
  description?: string;
  createdBy: number;
  members?: { userId: number; roleName: string }[];
  userManualUrl?: string;
}) {
  return await db.transaction(async (tx) => {

    const [project] = await tx
      .insert(projects)
      .values({
        title: options.title,
        description: options.description ?? null,
        createdBy: options.createdBy,
        userManual: options.userManualUrl ?? null
      })
      .returning();

    const roleList = await tx.select().from(roles);
    const roleMap = new Map(roleList.map((r) => [r.name, r]));

    const projectAdminRole = roleMap.get("project_admin");

    if (!projectAdminRole) {
      throw new ApiError(500, "Default role project_admin not found");
    }

    let hasProjectAdminInMembers = false;

    if (options.members?.length) {
      hasProjectAdminInMembers = options.members.some(
        (m) => m.roleName === "project_admin"
      );
    }


    await tx.insert(projectUsers).values({
      projectId: project.id,
      userId: options.createdBy,
      roleId: hasProjectAdminInMembers
        ? projectAdminRole.id 
        : projectAdminRole.id,
      readAccess: true,
      writeAccess: true,
      updateAccess: true,
      deleteAccess: true,
    });

    if (options.members?.length) {
      const uniqueUserIds = new Set<number>();

      for (const member of options.members) {

        if (member.userId === options.createdBy) continue;

        if (uniqueUserIds.has(member.userId)) {
          throw new ApiError(400, "Duplicate user in members list");
        }

        uniqueUserIds.add(member.userId);

        const role = roleMap.get(member.roleName);

        if (!role) {
          throw new ApiError(400, `Role ${member.roleName} not found`);
        }

        const isProjectAdmin = member.roleName === "project_admin";

        await tx.insert(projectUsers).values({
          projectId: project.id,
          userId: member.userId,
          roleId: role.id,
          readAccess: true,
          writeAccess: isProjectAdmin,
          updateAccess: isProjectAdmin,
          deleteAccess: isProjectAdmin,
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
        .select()
        .from(roles)
        .where(eq(roles.name, options.roleName));

      if (!role) {
        throw new ApiError(500, "Role not found");
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
        await tx.update(projectUsers)
          .set({ roleId: role.id})
          .where(
            and(
              eq(projectUsers.projectId, options.projectId),
              eq(projectUsers.userId, options.userId)
            )
          )
          return true;
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
  pagination: any,
  query: any
) {
  const { page, limit, offset, sortBy, order} = pagination;

  const isAdmin = systemRole === "admin" || systemRole === "super_admin";

  let baseQuery: any = db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description
    }).from(projects);

  if (!isAdmin) {
    baseQuery = baseQuery.innerJoin(projectUsers, eq(projects.id, projectUsers.projectId));
  }

  const whereClause = isAdmin ? isNull(projects.deletedAt) : and(
    eq(projectUsers.userId, userId),
    isNull(projects.deletedAt)
  );

  const sortingOption = {
    createdAt: projects.createdAt,
    title: projects.title,
  }

  const sortColumn = sortingOption[sortBy as keyof typeof sortingOption] || projects.createdAt;

  const data = await baseQuery
    .where(whereClause)
    .orderBy(order === "asc" ? asc(sortColumn) : desc(sortColumn))
    .limit(limit)
    .offset(offset)

    let countQuery : any = db.select({ total: count() }).from(projects);

  if (!isAdmin) {
    countQuery = countQuery.innerJoin(
      projectUsers,
      eq(projects.id, projectUsers.projectId)
    );
  }

  const [{ total }] = await countQuery.where(whereClause);

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

    if(!isAdmin){
      const membership = await db.query.projectUsers.findFirst({
        where: and(
          eq(projectUsers.projectId, projectId),
          eq(projectUsers.userId, userId)
        )
      });

      if(!membership){
        throw new ApiError(404, "Project not found or access denied");
      }
    }

    const result = await db
      .select()
      .from(projects)
      .leftJoin(projectUsers, eq(projects.id, projectUsers.projectId))
      .leftJoin(users, eq(projectUsers.userId, users.id))
      .leftJoin(roles, eq(projectUsers.roleId, roles.id))
      .where(eq(projects.id, projectId));

    if(!result.length){
      throw new ApiError(404, "Project not found");
    }

    const project = result[0].projects

    const members = result.filter(r => r.project_users != null).map(r => ({
      userId: r.users?.id,
      userName: r.users?.firstName,
      roleName: r.roles?.name,
      readAccess: r.project_users?.readAccess,
      writeAccess: r.project_users?.writeAccess,
      updateAccess: r.project_users?.updateAccess,
      deleteAccess: r.project_users?.deleteAccess,
    }))

    return {
      id: project.id,
    title: project.title,
    description: project.description,

    createdBy: project.createdBy,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    deletedAt: project.deletedAt,

    members
    }
  }

  async updateProject(
  projectId: number,
  userId: number,
  systemRole: string,
  data: { title?: string; description?: string }
) {

  const isSystemAdmin =
    systemRole === "admin" || systemRole === "super_admin";

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const membership = await db.query.projectUsers.findFirst({
    where: and(
      eq(projectUsers.projectId, projectId),
      eq(projectUsers.userId, userId)
    ),
  });

  const isProjectAdmin = membership?.updateAccess === true;

  if (!isSystemAdmin && !isProjectAdmin && project.createdBy !== userId) {
    throw new ApiError(403, "Not allowed to update this project");
  }

  const [updated] = await db
    .update(projects)
    .set({
      title: data.title,
      description: data.description,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning();

  return updated;
}

  async deleteProject(
  projectId: number,
  userId: number,
  systemRole: string
) {

  const isSystemAdmin =
    systemRole === "admin" || systemRole === "super_admin";

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const membership = await db.query.projectUsers.findFirst({
    where: and(
      eq(projectUsers.projectId, projectId),
      eq(projectUsers.userId, userId)
    ),
  });

  const isProjectAdmin = membership?.deleteAccess === true;

  if (!isSystemAdmin && !isProjectAdmin && project.createdBy !== userId) {
    throw new ApiError(403, "Not allowed to delete this project");
  }

  const result = await db
    .update(projects)
    .set({
      deletedAt: new Date(),
      deletedBy: userId,
    })
    .where(eq(projects.id, projectId))
    .returning();

  if (!result.length) {
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
