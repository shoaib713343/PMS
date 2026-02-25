import { eq } from "drizzle-orm";
import { db } from "../../db";
import { roles } from "../../db/schema";
import { ApiError } from "../../utils/ApiError";

class RoleService{
    async createRoles(name: string){
        const existing = await db.select().from(roles).where(eq(roles.name, name));

        if(existing.length>0){
            throw new ApiError(400, "Role already exists")
        }

    const [role] = await db.insert(roles).values({
        name
    }).returning()

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

    async rolesById(id: string){
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

    async updateRole(id: string, data:{name: string}){
        const [role] =  await db.update(roles).set({
            ...data
        }).where(eq(roles.id, id)).returning();

        if(!role){
            throw new ApiError(404, "Role not found")
        }
        return role;
    }

    async deleteRole(id: string){
        const result = await db.delete(roles).where(
            eq(roles.id, id)
        ).returning()

        if(result.length === 0){
            throw new ApiError(404, "Role not found")
        }
        return true;
    }
}

export const roleService = new RoleService();