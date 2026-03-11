import { boolean, date, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";

export const projectThreads = pgTable("project_threads", {
  id: integer("id").primaryKey(),

  projectId: integer("project_id")
    .references(() => projects.id)
    .notNull(),

  topic: text("topic").notNull(),

  description: text("description").notNull(),

  assignUserId: integer("assign_user_id")
    .references(() => users.id),

  priority: integer("priority"),

  dueDate: date("due_date"),

  endDate: date("end_date"),

  threadStatus: integer("thread_status"),

  typeOfIssue: integer("type_of_issue"),

  linkIssue: integer("link_issue"),

  isDeleted: boolean("is_deleted").default(false)
});