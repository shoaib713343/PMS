import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { projectThreads } from "./projectThreads";
import { users } from "./users";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),

  threadId: integer("thread_id")
    .notNull()
    .references(() => projectThreads.id, { onDelete: "cascade" }),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  content: text("content").notNull(),

  parentId: integer("parent_id"),

  createdAt: timestamp("created_at").defaultNow(),

  isDeleted: boolean("is_deleted").default(false),
});