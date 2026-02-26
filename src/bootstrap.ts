import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./db/schema/users";
import { eq } from "drizzle-orm";

export async function bootstrapSuperAdmin() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    console.log("No super admin env provided. Skipping bootstrap.");
    return;
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, superAdminEmail));

  if (existing.length > 0) {
    console.log("Super admin already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

  await db.insert(users).values({
    firstName: "Super",
    lastName: "Admin",
    email: superAdminEmail,
    password: hashedPassword,
    systemRole: "super_admin",
  });

  console.log("Super admin bootstrapped successfully.");
}