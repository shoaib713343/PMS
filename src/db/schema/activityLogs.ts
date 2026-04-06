import { integer, jsonb, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

export const activityLogs = pgTable("activity_logs", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(()=> users.id),
    action: varchar("action", { length: 50}).notNull(),
    entity: varchar("entity", { length: 50 }).notNull(),
    entityId: serial("entity_id"),
    projectId: integer("project_id").references(()=>projects.id),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow()
});