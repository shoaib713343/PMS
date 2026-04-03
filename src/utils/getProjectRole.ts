import { PROJECT_ROLES } from "../constants/projectRoles";
import { db } from "../db";

export async function getProjectRole(userId: number, projectId: number) {

    const record = await db.query.projectUsers.findFirst({
        where: (
            pu, { eq, and }
        ) => and(
            eq(pu.userId, userId),
            eq(pu.projectId, projectId)
        )
    })

    return record ? PROJECT_ROLES[record.roleId as keyof typeof PROJECT_ROLES] : null;
    
}