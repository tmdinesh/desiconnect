import { 
  admins, 
  sellers, 
  products, 
  orders, 
  users, 
  type Admin, 
  type InsertAdmin,
  type Seller,
  type InsertSeller,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type User,
  type InsertUser,
  type ProductStatus,
  type OrderStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne, desc, asc, like, gte, lte, sql } from "drizzle-orm";

// Define the storage interface
export interface IStorage {
  // Admin operations
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, admin: Partial<InsertAdmin>): Promise<Admin | undefined>;
  getAllAdmins(): Promise<Admin[]>;
  
  // Seller operations
  getSeller(id: number): Promise<Seller | undefined>;
  getSellerByEmail(email: string): Promise<Seller | undefined>;
  createSeller(seller: InsertSeller): Promise<Seller>;
  updateSeller(id: number, seller: Partial<InsertSeller>): Promise<Seller | undefined>;
  getAllSellers(): Promise<Seller[]>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductsBySeller(sellerId: number): Promise<Product[]>;
  getApprovedProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getPendingProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  updateProductStatus(id: number, status: ProductStatus): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrdersBySeller(sellerId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getOrdersByStatus(status: OrderStatus): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined>;
  updateOrderTracking(id: number, trackingNumber: string): Promise<Order | undefined>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserCart(id: number, cartData: any): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // Admin operations
  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [createdAdmin] = await db.insert(admins).values(admin).returning();
    return createdAdmin;
  }

  async getAllAdmins(): Promise<Admin[]> {
    return db.select().from(admins);
  }
  
  async updateAdmin(id: number, admin: Partial<InsertAdmin>): Promise<Admin | undefined> {
    const [updatedAdmin] = await db
      .update(admins)
      .set(admin)
      .where(eq(admins.id, id))
      .returning();
    return updatedAdmin;
  }

  // Seller operations
  async getSeller(id: number): Promise<Seller | undefined> {
    const [seller] = await db.select().from(sellers).where(eq(sellers.id, id));
    return seller;
  }

  async getSellerByEmail(email: string): Promise<Seller | undefined> {
    const [seller] = await db.select().from(sellers).where(eq(sellers.email, email));
    return seller;
  }

  async createSeller(seller: InsertSeller): Promise<Seller> {
    const [createdSeller] = await db.insert(sellers).values(seller).returning();
    return createdSeller;
  }

  async updateSeller(id: number, seller: Partial<InsertSeller>): Promise<Seller | undefined> {
    const [updatedSeller] = await db
      .update(sellers)
      .set(seller)
      .where(eq(sellers.id, id))
      .returning();
    return updatedSeller;
  }

  async getAllSellers(): Promise<Seller[]> {
    return db.select().from(sellers);
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsBySeller(sellerId: number): Promise<Product[]> {
    return db.select().from(products).where(eq(products.sellerId, sellerId));
  }

  async getApprovedProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.status, 'approved'));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(and(eq(products.category, category), eq(products.status, 'approved')));
  }

  async getPendingProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.status, 'pending'));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [createdProduct] = await db.insert(products).values(product).returning();
    return createdProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async updateProductStatus(id: number, status: ProductStatus): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ status })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(
        and(
          eq(products.status, 'approved'),
          sql`${products.name} ILIKE ${'%' + query + '%'} OR ${products.description} ILIKE ${'%' + query + '%'}`
        )
      );
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId));
  }

  async getOrdersBySeller(sellerId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.sellerId, sellerId));
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.status, status));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [createdOrder] = await db.insert(orders).values(order).returning();
    return createdOrder;
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderTracking(id: number, trackingNumber: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ trackingNumber, status: 'fulfilled' })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserCart(id: number, cartData: any): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ cartData })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
}

export const storage = new DatabaseStorage();
