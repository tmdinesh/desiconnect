import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  varchar,
  numeric,
  foreignKey,
  json,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const productStatusEnum = pgEnum('product_status', ['pending', 'approved', 'rejected']);
export const orderStatusEnum = pgEnum('order_status', ['placed', 'ready', 'fulfilled']);

// Admin Table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminsRelations = relations(admins, ({ many }) => ({
  sellers: many(sellers),
}));

// Seller Table
export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  businessName: text("business_name").notNull(),
  warehouseAddress: text("warehouse_address"),
  businessAddress: text("business_address"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  gst: text("gst"),
  adminId: integer("admin_id").references(() => admins.id),
  approved: boolean("approved").default(false),
  rejected: boolean("rejected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sellersRelations = relations(sellers, ({ one, many }) => ({
  admin: one(admins, {
    fields: [sellers.adminId],
    references: [admins.id],
  }),
  products: many(products),
  orders: many(orders),
}));

// Product Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  status: productStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(sellers, {
    fields: [products.sellerId],
    references: [sellers.id],
  }),
  orders: many(orders),
}));

// Order Table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  sellerId: integer("seller_id").notNull().references(() => sellers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  customerName: text("customer_name").notNull(),
  address: text("address").notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  customerMessage: text("customer_message"),
  status: orderStatusEnum("status").notNull().default('placed'),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ordersRelations = relations(orders, ({ one }) => ({
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  seller: one(sellers, {
    fields: [orders.sellerId],
    references: [sellers.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

// User (Customer) Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  address: text("address"),
  cartData: json("cart_data").$type<{ items: Array<{productId: number, quantity: number, message: string}> }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

// Zod Schemas
export const insertAdminSchema = createInsertSchema(admins).omit({ id: true, createdAt: true });
export const selectAdminSchema = createSelectSchema(admins);

export const insertSellerSchema = createInsertSchema(sellers).omit({ id: true, createdAt: true, approved: true, rejected: true });
export const selectSellerSchema = createSelectSchema(sellers);

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const selectProductSchema = createSelectSchema(products);

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const selectOrderSchema = createSelectSchema(orders);

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, cartData: true });
export const selectUserSchema = createSelectSchema(users);

export const updateCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().positive(),
      message: z.string().optional(),
    })
  ),
});

// Types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = z.infer<typeof insertSellerSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ProductStatus = 'pending' | 'approved' | 'rejected';
export type OrderStatus = 'placed' | 'ready' | 'fulfilled';
