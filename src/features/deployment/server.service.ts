import { eq, isNull } from "drizzle-orm";
import { db } from "../../db";
import { projectServers, servers } from "../../db/schema";
import { ApiError } from "../../utils/ApiError";

type AuthUser = {
    id: number;
     systemRole: "admin" | "user" | "super_admin";
}

export class ServerService {
    async createServer(data: any, user: AuthUser){
        if(user.systemRole !== "super_admin"){
            throw new ApiError(403, "Only super admin can create servers");
        }

        const [server] = await db.insert(servers).values({
            publicIp: data.publicIp,
            privateIp: data.privateIp,
            environment: data.environment,
            serverType: data.serverType,
            status: data.status || "active"
        }).returning();

        return server;
    }

    async listServers(){
        return await db.select().from(servers).where(isNull(servers.deletedAt))
    }

    async assignServerToProject(projectId: number, serverId: number, user: AuthUser){
        if(user.systemRole !== "super_admin"){
            throw new ApiError(403, "Only super admin can assign servers to projects");
        }

        const [assignment] = await db.insert(projectServers).values({
            projectId,
            serverId,
            deployedBy: user.id
        }).returning();

        return assignment;
    }

    async getProjectServers(projectId: number){
        return await db
            .select()
            .from(projectServers)
            .innerJoin(servers, eq(projectServers.serverId, servers.id))
            .where(eq(projectServers.projectId, projectId))
    }

    // Update server
async updateServer(serverId: number, data: any, user: AuthUser) {
  if (user.systemRole !== "super_admin") {
    throw new ApiError(403, "Only super admin can update servers");
  }

  const [updated] = await db.update(servers)
    .set({
      publicIp: data.publicIp,
      privateIp: data.privateIp,
      environment: data.environment,
      serverType: data.serverType,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(eq(servers.id, serverId))
    .returning();

  if (!updated) {
    throw new ApiError(404, "Server not found");
  }

  return updated;
}

// Delete server (soft delete or hard delete)
async deleteServer(serverId: number, user: AuthUser) {
  if (user.systemRole !== "super_admin") {
    throw new ApiError(403, "Only super admin can delete servers");
  }

  // Check if server is assigned to any project
  const assignments = await db.select()
    .from(projectServers)
    .where(eq(projectServers.serverId, serverId));

  if (assignments.length > 0) {
    throw new ApiError(400, "Cannot delete server. It's assigned to projects. Remove assignments first.");
  }

  const [deleted] = await db.delete(servers)
    .where(eq(servers.id, serverId))
    .returning();

  if (!deleted) {
    throw new ApiError(404, "Server not found");
  }

  return { success: true };
}

}

export const serverService = new ServerService();