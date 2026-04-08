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
}

export const serviceManagementService = new ServiceManagementService();