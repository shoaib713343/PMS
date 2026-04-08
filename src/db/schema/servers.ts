import { varchar } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { integer } from "drizzle-orm/pg-core";
import { serial } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const servers = pgTable("servers", {
    id: serial("id").primaryKey(),
    publicIp: varchar("public_ip", {length: 255}).notNull(),
    privateIp: varchar("private_ip", {length: 255}),
    environment: integer("environment").notNull(),
    serverType: integer("server_type").notNull(),
    status: varchar("status", {length: 50}).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at")
});