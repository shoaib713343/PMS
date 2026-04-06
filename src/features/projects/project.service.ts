import { eq, isNull, and, count, desc, asc } from "drizzle-orm";
import { db } from "../../db";
import { projectUsers, roles, users } from "../../db/schema";
import { projects } from "../../db/schema/projects";
import { ApiError } from "../../utils/ApiError";

import { getProjectContext } from "../../utils/getProjectContext";
import { canAccessProject } from "../../utils/projectAccess";
import { hasPermission } from "../../utils/permission";
import { ACTIONS } from "../../constants/actions";

type AuthUser = {
  id: number;
  systemRole: "admin" | "user" | "super_admin";
};

class ProjectService {

  // CREATE PROJECT
  
async createProject(options: {
  title: string;
  description?: string;
  createdBy: number;
  members?: { userId: number; roleName: string }[];
  userManualUrl?: string;
}) {
  return await db.transaction(async (tx) => {
    // Validate required fields
    if (!options.title) {
      throw new ApiError(400, "Project title is required");
    }

    if (!options.createdBy) {
      throw new ApiError(400, "CreatedBy is required");
    }

    const [project] = await tx
      .insert(projects)
      .values({
        title: options.title,
        description: options.description ?? null,
        createdBy: options.createdBy,
        userManual: options.userManualUrl ?? null
      })
      .returning();

    // Get all roles
    const roleList = await tx.select().from(roles);
    const roleMap = new Map(roleList.map((r) => [r.name, r]));

    // Check if project_admin role exists
    const projectAdminRole = roleMap.get("project_admin");
    if (!projectAdminRole) {
      throw new ApiError(500, "project_admin role not found in database");
    }

    // Add creator as project_admin
    await tx.insert(projectUsers).values({
      projectId: project.id,
      userId: options.createdBy,
      roleId: projectAdminRole.id,
      readAccess: true,
      writeAccess: true,
      updateAccess: true,
      deleteAccess: true,
    });

    // Add members if provided
    if (options.members && options.members.length > 0) {
      const uniqueUserIds = new Set<number>();
      uniqueUserIds.add(options.createdBy); // Prevent adding creator again

      for (const member of options.members) {
        // Validate member data
        if (!member.userId) {
          console.warn('Skipping member with no userId:', member);
          continue;
        }

        if (!member.roleName) {
          console.warn(`Skipping member ${member.userId} with no roleName`);
          continue;
        }

        // Skip if already added (creator)
        if (member.userId === options.createdBy) {
          continue;
        }

        // Check for duplicates
        if (uniqueUserIds.has(member.userId)) {
          throw new ApiError(400, `Duplicate member: ${member.userId}`);
        }
        uniqueUserIds.add(member.userId);

        // Get role
        const role = roleMap.get(member.roleName);
        if (!role) {
          throw new ApiError(400, `Role "${member.roleName}" not found. Available roles: ${Array.from(roleMap.keys()).join(', ')}`);
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

  // LIST PROJECTS

  async listProjects(user: AuthUser, pagination: any) {
    const { page, limit, offset, sortBy, order } = pagination;

    let baseQuery: any = db.select({
      id: projects.id,
      title: projects.title,
      description: projects.description
    }).from(projects);

    let whereClause;

    if (user.systemRole === "super_admin") {
      whereClause = isNull(projects.deletedAt);
    }

    else if (user.systemRole === "admin") {
      whereClause = and(
        eq(projects.createdBy, user.id),
        isNull(projects.deletedAt)
      );
    }

    else {
      baseQuery = baseQuery
        .innerJoin(
          projectUsers,
          eq(projects.id, projectUsers.projectId)
        );

      whereClause = and(
        eq(projectUsers.userId, user.id),
        isNull(projects.deletedAt)
      );
    }

    const sortingOption = {
      createdAt: projects.createdAt,
      title: projects.title,
    };

    const sortColumn =
      sortingOption[sortBy as keyof typeof sortingOption] ||
      projects.createdAt;

    const data = await baseQuery
      .where(whereClause)
      .orderBy(order === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    // count
    let countQuery;

    if (user.systemRole === "user") {
      countQuery = db.select({ total: count() }).from(projects)
        .innerJoin(
          projectUsers,
          eq(projects.id, projectUsers.projectId)
        );
    } else {
      countQuery = db.select({ total: count() }).from(projects);
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

  // GET PROJECT DETAILS

  async getProjectDetails(projectId: number, user: AuthUser) {

    const { project, projectRole } = await getProjectContext(user, projectId);

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access to project");
    }

    const result = await db
      .select()
      .from(projects)
      .leftJoin(projectUsers, eq(projects.id, projectUsers.projectId))
      .leftJoin(users, eq(projectUsers.userId, users.id))
      .leftJoin(roles, eq(projectUsers.roleId, roles.id))
      .where(eq(projects.id, projectId));

    if (!result.length) {
      throw new ApiError(404, "Project not found");
    }

    const proj = result[0].projects;

    const members = result
      .filter(r => r.project_users != null)
      .map(r => ({
        userId: r.users?.id,
        userName: r.users?.firstName,
        roleName: r.roles?.name,
      }));

    return {
      id: proj.id,
      title: proj.title,
      description: proj.description,
      createdBy: proj.createdBy,
      members
    };
  }

  // UPDATE PROJECT

  async updateProject(projectId: number, user: AuthUser, data: any) {

    const { project, projectRole } = await getProjectContext(user, projectId);

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access");
    }

    if (!hasPermission({
      user,
      action: ACTIONS.UPDATE_PROJECT,
      project,
      projectRole
    })) {
      throw new ApiError(403, "Not allowed");
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

  // DELETE PROJECT

  async deleteProject(projectId: number, user: AuthUser) {

    const { project, projectRole } = await getProjectContext(user, projectId);

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access");
    }

    if (!hasPermission({
      user,
      action: ACTIONS.DELETE_PROJECT,
      project,
      projectRole
    })) {
      throw new ApiError(403, "Not allowed");
    }

    await db
      .update(projects)
      .set({
        deletedAt: new Date(),
        deletedBy: user.id,
      })
      .where(eq(projects.id, projectId));

    return true;
  }

  // ASSIGN MEMBER

  async assignUserToProject(
    projectId: number,
    targetUserId: number,
    roleName: string,
    user: AuthUser
  ) {

    const { project, projectRole } = await getProjectContext(user, projectId);

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access");
    }

    if (!hasPermission({
      user,
      action: ACTIONS.INVITE_MEMBER,
      project,
      projectRole
    })) {
      throw new ApiError(403, "Not allowed");
    }

    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleName));

    if (!role) {
      throw new ApiError(400, "Role not found");
    }

    const existing = await db
      .select()
      .from(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, projectId),
          eq(projectUsers.userId, targetUserId)
        )
      );

    if (existing.length) {
      await db.update(projectUsers)
        .set({ roleId: role.id })
        .where(
          and(
            eq(projectUsers.projectId, projectId),
            eq(projectUsers.userId, targetUserId)
          )
        );
      return true;
    }

    await db.insert(projectUsers).values({
      projectId,
      userId: targetUserId,
      roleId: role.id,
      readAccess: true,
      writeAccess: false,
      updateAccess: false,
      deleteAccess: false,
    });

    return true;
  }

  // REMOVE MEMBER
  async removeProjectMember(
    projectId: number,
    targetUserId: number,
    user: AuthUser
  ) {

    const { project, projectRole } = await getProjectContext(user, projectId);

    if (!canAccessProject(user, { ...project, createdBy: project.createdBy! }, projectRole)) {
      throw new ApiError(403, "No access");
    }

    if (!hasPermission({
      user,
      action: ACTIONS.INVITE_MEMBER,
      project,
      projectRole
    })) {
      throw new ApiError(403, "Not allowed");
    }

    await db
      .delete(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, projectId),
          eq(projectUsers.userId, targetUserId)
        )
      );

    return true;
  }
}

export const projectService = new ProjectService();