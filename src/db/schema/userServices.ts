import { pgTable, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { services } from "./services";
import { varchar } from "drizzle-orm/pg-core";

export const userServices = pgTable("user_services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  accessLevel: varchar("access_level", { length: 50 }).default("read"), // read, write, admin
  grantedAt: timestamp("granted_at").defaultNow(),
  grantedBy: integer("granted_by"),
}, (table) => {
  return {
    uniqueUserService: uniqueIndex("unique_user_service_idx").on(table.userId, table.serviceId),
  };
});