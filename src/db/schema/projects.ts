import { serial, pgTable, varchar, text, integer, timestamp, index, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const projects = pgTable("projects", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", {length: 255}).notNull(),
    description: text("description"),
    createdBy: uuid("created_by").references(()=>users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: uuid("deleted_by").references(()=>users.id)
},(table)=>{
    return {
        createdByIdx: index("projects_created_by_idx").on(table.createdBy),
        deletedAtIdx: index("projects_deleted_at_idx").on(table.deletedAt),
    }
});