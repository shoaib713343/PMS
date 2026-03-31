import { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { tasks } from "./tasks"; 
import { messages } from "./messages"; 

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  publicId: text("public_id").notNull(), 
  resourceType: varchar("resource_type", { length: 50 }).notNull(), 
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  messageId: integer("message_id").references(() => messages.id, { onDelete: "cascade" }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});