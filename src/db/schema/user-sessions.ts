import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  index,
  uuid
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),

  userId: serial("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  refreshToken: text("refresh_token").notNull(),

  isRevoked: boolean("is_revoked").default(false).notNull(),

  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull()
}, (table) => {
  return {
    userIdIdx: index("user_sessions_user_id_idx").on(table.userId),
    refreshIdx: index("user_sessions_refresh_token_idx").on(table.refreshToken)
  };
});