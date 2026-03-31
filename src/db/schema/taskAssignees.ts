import { integer, pgTable, serial } from "drizzle-orm/pg-core";
import { tasks } from "./tasks";
import { users } from "./users";

export const taskAssignees = pgTable("task_assignees", {
  id: serial("id").primaryKey(),

  taskId: integer("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),

  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
});