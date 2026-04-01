import { eq, desc } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { activityLogs } from "../../db/schema/activityLogs";

export const logActivity = async({
    userId,
    action,
    entity,
    entityId,
    metadata,
    projectId
}: {
    userId: number;
    action: string;
    entity: string;
    entityId: number;
    metadata?: any;
    projectId: number;
}) => {
    await db.insert(activityLogs).values({
        userId,
        action,
        entity,
        entityId,
        metadata,
        projectId
    })
}

export const getProjectActivityLogs = async(projectId: number, limit: number, offset: number, entity: string) => {
    const logs = await db.select({
        id: activityLogs.id,
        action: activityLogs.action,
        entity: activityLogs.entity,
        entityId: activityLogs.entityId,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
        userName: users.firstName,
    }).from(activityLogs)
       .leftJoin(users, eq(users.id, activityLogs.userId)).where(entity ? eq(activityLogs.entity, entity) : undefined).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset);
    return logs;
}