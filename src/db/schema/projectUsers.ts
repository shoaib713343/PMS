import { pgTable, serial, varchar, text, timestamp, integer, index, uuid, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";
import { roles } from "./roles";

export const projectUsers = pgTable("project_users", {
  id: serial("id").primaryKey(),

  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  roleId: serial("role_id")
    .notNull()
    .references(() => roles.id),

  readAccess: boolean("read_access").default(false).notNull(),
  writeAccess: boolean("write_access").default(false).notNull(),
  updateAccess: boolean("update_access").default(false).notNull(),
  deleteAccess: boolean("delete_access").default(false).notNull(),

  isDeleted: boolean("is_deleted").default(false).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => {
    return {
        projectIdIdx: index("pm_project_id_idx").on(table.projectId),
        userIdIdx: index("pm_user_id_idx").on(table.userId),
        uniqueMember: uniqueIndex("pm_unique_member_idx").on(table.projectId, table.userId)
    }
})