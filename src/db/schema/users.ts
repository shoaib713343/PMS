import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  pgEnum,
  timestamp
} from "drizzle-orm/pg-core";


export const systemRoleEnum = pgEnum("system_role", [
  "user",
  "admin",
  "super_admin",
]);

export const users = pgTable("users", {
  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  firstName: varchar("first_name", {length: 100}).notNull(),
  lastName: varchar("last_name", {length: 100}).notNull(),

  email: varchar("email", { length: 255 })
    .notNull()
    .unique(),

  password: text("password_digest")
    .notNull(),

  systemRole: systemRoleEnum("system_role")
    .default("user")
    .notNull(),

  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  isDeleted: boolean("is_deleted")
    .default(false)
    .notNull(),
});