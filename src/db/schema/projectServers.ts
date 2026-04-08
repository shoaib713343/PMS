// db/schema/projectServers.ts
import { pgTable, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { servers } from "./servers";
import { varchar } from "drizzle-orm/pg-core";

export const projectServers = pgTable("project_servers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  serverId: integer("server_id").notNull().references(() => servers.id, { onDelete: "cascade" }),
  deployedAt: timestamp("deployed_at").defaultNow(),
  deployedBy: integer("deployed_by"),
  status: varchar("status", { length: 50 }).default("active"),
}, (table) => {
  return {
    uniqueProjectServer: uniqueIndex("unique_project_server_idx").on(table.projectId, table.serverId),
  };
});