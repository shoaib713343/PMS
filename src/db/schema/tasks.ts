import { boolean, integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projectThreads } from "./projectThreads";

const taskStatusEnum = pgEnum("task_status", [
    "pending",
    "in_progress",
    "completed"
])

export const tasks = pgTable("tasks",{

  id:serial("id").primaryKey(),

  threadId:integer("thread_id")
     .references(()=>projectThreads.id)
     .notNull(),

  title:text("title").notNull(),

  description:text("description").notNull(),

  gitLink:text("git_link"),

  createdUser:integer("created_user")
     .references(()=>users.id),

  targetDate:timestamp("target_date"),

  taskStatus:text("task_status").default("TODO"),

  createdAt:timestamp("created_at").defaultNow(),

  updatedAt:timestamp("updated_at").defaultNow(),

  isDeleted:boolean("is_deleted").default(false)

});