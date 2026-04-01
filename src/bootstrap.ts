import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./db/schema/users";
import { eq } from "drizzle-orm";

export async function bootstrapAdmins() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // 🔴 SUPER ADMIN
  if (superAdminEmail && superAdminPassword) {
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, superAdminEmail));

    if (existingSuperAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

      await db.insert(users).values({
        firstName: "Super",
        lastName: "Admin",
        email: superAdminEmail,
        password: hashedPassword,
        systemRole: "super_admin",
      });

      console.log("Super admin created ✅");
    } else {
      console.log("Super admin already exists");
    }
  }

  // 🔵 ADMIN
  if (adminEmail && adminPassword) {
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail));

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await db.insert(users).values({
        firstName: "Admin",
        lastName: "User",
        email: adminEmail,
        password: hashedPassword,
        systemRole: "admin",
      });

      console.log("Admin created ✅");
    } else {
      console.log("Admin already exists");
    }
  }
}