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
      .leftJoin(roles, eq(projectUsers.roleId, roles.id));

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
