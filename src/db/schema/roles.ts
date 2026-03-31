import { pgTable, serial, uuid, varchar } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
    id: serial("id").primaryKey(),
    name: varchar("name", {length: 255}).notNull()
})