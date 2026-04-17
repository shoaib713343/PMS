import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { projectUsers, roles } from "../db/schema";

export async function getProjectRole(userId: number, projectId: number): Promise<string | null> {
    const result = await db
        .select({
            roleName: roles.name,
        })
        .from(projectUsers)
        .leftJoin(roles, eq(projectUsers.roleId, roles.id))
        .where(
            and(
                eq(projectUsers.userId, userId),
                eq(projectUsers.projectId, projectId)
            )
        )
        .then(res => res[0]);

    // Return the actual role name from database (testa, developer, etc.)
    return result?.roleName || null;
}