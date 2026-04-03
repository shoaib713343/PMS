import { eq } from "drizzle-orm";
import { db } from "../../db";
import { roles } from "../../db/schema";
import { ApiError } from "../../utils/ApiError";
import { AuthUser } from "../../types/auth";

class RoleService{
    async createRoles(name: string, user: AuthUser){

  if (user.systemRole !== "super_admin") {
    throw new ApiError(403, "Only super admin can create roles");
  }

  const existing = await db.select()
    .from(roles)
    .where(eq(roles.name, name));

  if (existing.length > 0) {
    throw new ApiError(400, "Role already exists");
  }

  const [role] = await db.insert(roles)
    .values({ name })
    .returning();

  return role;
}

    async listRoles(){
        return await db.select
        (
            {
                id: roles.id,
                name: roles.name
            }
        ).from(roles)
    }

    async rolesById(id: number){
        const [role] = await db.select({
            id: roles.id,
            name: roles.name
        }).from(roles).where(
            eq(roles.id, id)
        )

        if(!role){
            throw new ApiError(404, "Role not found");
        }

        return role;
    }

    async updateRole(id: number, data: { name: string }, user: AuthUser) {

  if (user.systemRole !== "super_admin") {
    throw new ApiError(403, "Only super admin can update roles");
  }

  // check duplicate
  const existing = await db.select()
    .from(roles)
    .where(eq(roles.name, data.name));

  if (existing.length > 0) {
    throw new ApiError(400, "Role name already exists");
  }

  const [role] = await db.update(roles)
    .set({
      name: data.name
    })
    .where(eq(roles.id, id))
    .returning();

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  return role;
}

    async deleteRole(id: number, user: AuthUser) {

  if (user.systemRole !== "super_admin") {
    throw new ApiError(403, "Only super admin can delete roles");
  }

  const result = await db.delete(roles)
    .where(eq(roles.id, id))
    .returning();

  if (result.length === 0) {
    throw new ApiError(404, "Role not found");
  }

  return true;
}
}

export const roleService = new RoleService();