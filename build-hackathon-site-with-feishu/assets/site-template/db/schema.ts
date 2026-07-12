import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const registrations = sqliteTable("registrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  organization: text("organization").notNull().default(""),
  role: text("role").notNull(),
  track: text("track").notNull(),
  teamName: text("team_name").notNull().default(""),
  teamSize: integer("team_size").notNull().default(1),
  projectIdea: text("project_idea").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("registrations_email_unique").on(table.email)]);

export const registrationSync = sqliteTable("registration_sync", {
  email: text("email").primaryKey(),
  feishuRange: text("feishu_range").notNull().default(""),
  lastError: text("last_error").notNull().default(""),
  syncedAt: text("synced_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
