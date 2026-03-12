import { boolean, date, integer, serial, text, timestamp, pgTable } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";

export const projectThreads = pgTable("project_threads", {
  id: serial("id").primaryKey(),

  projectId: integer("project_id")
    .references(() => projects.id)
    .notNull(),

  topic: text("topic").notNull(),

  description: text("description").notNull(),

  assignUserId: integer("assign_user_id")
    .references(() => users.id),

  createdUser: integer("created_user")
    .references(() => users.id)
    .notNull(),

  priority: integer("priority"),

  dueDate: date("due_date"),

  endDate: date("end_date"),

  threadStatus: integer("thread_status").default(1),

  typeOfIssue: integer("type_of_issue"),

  linkIssue: integer("link_issue")
    .references((): any => projectThreads.id),

  isDeleted: boolean("is_deleted").default(false),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow()
});