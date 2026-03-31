import bcrypt from "bcryptjs";

import { db } from "../../db";
import { users } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError";

type createUserOption = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

class UserService{
    async createUser(options: createUserOption){
            const {firstName, lastName, email, password} = options;
            const hashedPassword = await bcrypt.hash(password, 10);
    
            const result = await db.insert(users).values({
                firstName,
                lastName,
                email,
                password: hashedPassword,
            }).returning({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                role: users.systemRole
            });
    
            return result[0];
        }

      async listUsers() {
        return await db
        .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
                })
            .from(users)
            .where(eq(users.isDeleted, false));
        }

    async getUserById(id: number) {
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        systemRole: users.systemRole,
      })
      .from(users)
      .where(and(eq(users.id, id), eq(users.isDeleted, false)));

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  async updateUser(id: number, data: any) {
    const [updated] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new ApiError(404, "User not found");
    }

    return updated;
  }

  async deleteUser(id: number) {
    const result = await db
      .update(users)
      .set({
        isDeleted: true,
      })
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new ApiError(404, "User not found");
    }

    return true;
  }
}

export const userService = new UserService();