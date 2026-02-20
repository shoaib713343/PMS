import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  index
} from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),

  projectId: integer("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),

  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),

  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table)=> {
    return {
        projectIdIdx: index("notes_project_id_idx").on(table.projectId),
    };
});