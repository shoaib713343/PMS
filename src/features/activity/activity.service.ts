import { db } from "../../db";
import { users } from "../../db/schema";
import { activityLogs } from "../../db/schema/activityLogs";

import { eq, desc, and, count } from "drizzle-orm";

export const getProjectActivity = async ({
  projectId,
  page,
  limit,
  entity,
  action,
}: {
  projectId: number;
  page: number;
  limit: number;
  entity?: string;
  action?: string;
}) => {
  const safeLimit = Math.min(limit, 50);
  const offset = (page - 1) * safeLimit;

  const filters = and(
    eq(activityLogs.projectId, projectId),
    entity ? eq(activityLogs.entity, entity) : undefined,
    action ? eq(activityLogs.action, action) : undefined
  );

  const data = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      entity: activityLogs.entity,
      entityId: activityLogs.entityId,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
      userName: users.firstName,
    })
    .from(activityLogs)
    .leftJoin(users, eq(users.id, activityLogs.userId))
    .where(filters)
    .orderBy(desc(activityLogs.createdAt))
    .limit(safeLimit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(activityLogs)
    .where(filters);

  return {
    data,
    pagination: {
      page,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const logActivity = async ({
  userId,
  action,
  entity,
  entityId,
  metadata,
  projectId,
}: {
  userId: number;
  action: string;
  entity: string;
  entityId: number;
  metadata?: any;
  projectId: number;
}) => {
  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      entity,
      entityId,
      metadata,
      projectId,
    });
  } catch (error) {
    console.error("Activity log failed:", error);
  }
};