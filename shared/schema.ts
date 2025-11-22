import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  
  // Role: 'admin' or 'tecnico'
  role: text("role").notNull().default('tecnico'),
  
  // Account status
  isActive: integer("is_active").notNull().default(1), // 1 = active, 0 = inactive
  lastAccess: timestamp("last_access"),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Stripe fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  
  // Subscription plan: 'free', 'premium', 'plus', 'pro'
  subscriptionPlan: text("subscription_plan").notNull().default('free'),
  subscriptionStatus: text("subscription_status").default('active'), // 'active', 'canceled', 'past_due'
  
  // Search limits
  searchesUsed: integer("searches_used").notNull().default(0),
  searchesLimit: integer("searches_limit").notNull().default(3), // Default for free plan
  searchesResetAt: timestamp("searches_reset_at").defaultNow(),
  
  // Pro plan: team members
  teamOwnerId: text("team_owner_id"),
  isTeamMember: integer("is_team_member").notNull().default(0), // 0 = false, 1 = true
  
  // Password reset
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
});

export const diagrams = pgTable("diagrams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  directUrl: text("direct_url").notNull(),
  fileId: text("file_id").notNull().unique(), // UNIQUE para upserts, NOT NULL porque es identificador
  
  // Metadata - AHORA OPCIONALES (nullable)
  make: text("make"),
  model: text("model"),
  year: text("year"),
  system: text("system"),
  tags: text("tags"),
  notes: text("notes"),
  
  // Status del diagrama: 'complete' o 'partial'
  status: text("status").default('partial'),
  
  // Campo de búsqueda concatenado: file_name + make + model + year + system
  searchText: text("search_text"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  uploadedBy: text("uploaded_by"),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('usd'),
  status: text("status").notNull(), // 'paid', 'pending', 'failed'
  plan: text("plan"),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const diagramHistory = pgTable("diagram_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  diagramId: text("diagram_id").notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertDiagramSchema = createInsertSchema(diagrams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  searchText: true, // searchText se calcula automáticamente
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertDiagramHistorySchema = createInsertSchema(diagramHistory).omit({
  id: true,
  viewedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Diagram = typeof diagrams.$inferSelect;
export type InsertDiagram = z.infer<typeof insertDiagramSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
export type DiagramHistory = typeof diagramHistory.$inferSelect;
export type InsertDiagramHistory = z.infer<typeof insertDiagramHistorySchema>;
