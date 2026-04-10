import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";

export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  type: varchar("type", { length: 50 }), // task_assigned, project_invite, etc.
  status: varchar("status", { length: 50 }).default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;