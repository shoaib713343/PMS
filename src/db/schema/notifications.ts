import { integer } from "drizzle-orm/pg-core";
import { serial } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { users } from "./users";
import { varchar } from "drizzle-orm/pg-core";
import { text } from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";

export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(()=> users.id, { onDelete: "cascade"}),
    type: varchar("type", { length: 50}),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    isRead: boolean("is_read").default(false),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: integer("entity_id"),
    actionUrl: text("action_url"),
    createdAt: timestamp("created_at").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;