import { pgTable, text, serial, integer, timestamp, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  bio: text("bio"),
  position: text("position"),
  role: text("role").notNull().default("user"),
  profileImageUrl: text("profile_image_url"),
  settings: jsonb("settings").default('{"currency": "PHP", "dateFormat": "MM/DD/YYYY", "timezone": "UTC+8"}'),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  backupCodes: text("backup_codes").array(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  position: true,
  role: true,
  profileImageUrl: true,
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertCategorySchema = createInsertSchema(categories);

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id").notNull(),
  price: real("price").notNull(),
  costPrice: real("cost_price").notNull(),
  minStockLevel: integer("min_stock_level").notNull().default(10),
  imageUrl: text("image_url"),
  currentStock: integer("current_stock").notNull().default(0),
  isFoodProduct: boolean("is_food_product").notNull().default(false),
  shelfLife: integer("shelf_life_days"), // Shelf life in days
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

// Inventory batches table - tracks each batch of stock with its own expiration date
export const inventoryBatches = pgTable("inventory_batches", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  batchNumber: text("batch_number").notNull(),
  quantity: integer("quantity").notNull(),
  remainingQuantity: integer("remaining_quantity").notNull(),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").notNull(),
});

export const insertInventoryBatchSchema = createInsertSchema(inventoryBatches).omit({
  id: true,
  createdAt: true,
});

// Stock transactions table
export const stockTransactions = pgTable("stock_transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(), // 'in' or 'out'
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  userId: integer("user_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  batchId: integer("batch_id"), // Reference to inventory batch
  batchNumber: text("batch_number"),
  expiryDate: timestamp("expiry_date"),
  status: text("status").default("completed"), // 'pending' or 'completed'
});

export const insertStockTransactionSchema = createInsertSchema(stockTransactions).omit({
  id: true,
  timestamp: true,
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id"),
  status: text("status").notNull().default("pending"),
  totalAmount: real("total_amount").notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderDate: true,
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertInventoryBatch = z.infer<typeof insertInventoryBatchSchema>;
export type InventoryBatch = typeof inventoryBatches.$inferSelect;

export type InsertStockTransaction = z.infer<typeof insertStockTransactionSchema>;
export type StockTransaction = typeof stockTransactions.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Password Reset Tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
