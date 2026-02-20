import { pgTable, serial, uuid, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const roles = pgTable("roles", {
    id: uuid("id").primaryKey(),
    projectId: uuid("project_id").references(()=>projects.id),
    name: varchar("name", {length: 255}).notNull()
})