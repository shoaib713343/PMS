import { db } from "../../db";
import { services } from "../../db/schema/services";
import { userServices } from "../../db/schema/userServices";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError";

type AuthUser = {
  id: number;
  systemRole: "admin" | "user" | "super_admin";
};

export class ServiceManagementService {
  async createService(data: any, user: AuthUser) {
    if (user.systemRole !== "super_admin") {
      throw new ApiError(403, "Only super admin can create services");
    }

    const [service] = await db.insert(services).values({
      name: data.name,
      description: data.description,
    }).returning();

    return service;
  }

  async listServices() {
    return await db.select().from(services).where(eq(services.isDeleted, false));
  }

  async assignServiceToUser(userId: number, serviceId: number, accessLevel: string, grantedBy: number) {
    const [assignment] = await db.insert(userServices).values({
      userId,
      serviceId,
      accessLevel,
      grantedBy,
    }).returning();

    return assignment;
  }

  async getUserServices(userId: number) {
    return await db
      .select()
      .from(userServices)
      .innerJoin(services, eq(userServices.serviceId, services.id))
      .where(eq(userServices.userId, userId));
  }

  // Update service
async updateService(serviceId: number, data: any, user: AuthUser) {
  if (user.systemRole !== "super_admin") {
    throw new ApiError(403, "Only super admin can update services");
  }

  const [updated] = await db.update(services)
    .set({
      name: data.name,
      description: data.description,
      updatedAt: new Date(),
    })
    .where(eq(services.id, serviceId))
    .returning();

  if (!updated) {
    throw new ApiError(404, "Service not found");
  }

  return updated;
}

// Soft delete service
async deleteService(serviceId: number, user: AuthUser) {
  if (user.systemRole !== "super_admin") {
    throw new ApiError(403, "Only super admin can delete services");
  }

  const [updated] = await db.update(services)
    .set({
      isDeleted: true,
      updatedAt: new Date(),
    })
    .where(eq(services.id, serviceId))
    .returning();

  if (!updated) {
    throw new ApiError(404, "Service not found");
  }

  return { success: true };
}

// Remove service from user
async removeServiceFromUser(userId: number, serviceId: number, user: AuthUser) {
  if (user.systemRole !== "super_admin") {
    throw new ApiError(403, "Only super admin can remove service assignments");
  }

  await db.delete(userServices)
    .where(and(
      eq(userServices.userId, userId),
      eq(userServices.serviceId, serviceId)
    ));

  return { success: true };
}
}

export const serviceManagementService = new ServiceManagementService();