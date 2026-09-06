import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const keys = sqliteTable("keys", {
  id: text("id").primaryKey(),
  key: text("key").unique().notNull(),
  product: text("product").notNull(),
  status: text("status").default("created").notNull(),
  durationDays: integer("duration_days").notNull(),
  hwid: text("hwid"),
  activatedAt: integer("activated_at"),
  expiresAt: integer("expires_at"),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("user").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const logs = sqliteTable("logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  action: text("action").notNull(),
  detail: text("detail"),
  ip: text("ip"),
  createdAt: integer("created_at").notNull(),
});
