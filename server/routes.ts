import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";

// Import controllers
import * as authController from "./controllers/auth";
import * as adminController from "./controllers/admin";
import * as sellerController from "./controllers/seller";
import * as customerController from "./controllers/customer";
import * as productController from "./controllers/product";
import * as orderController from "./controllers/order";
import * as testDataController from "./controllers/testData";

// Import middleware
import { authenticate, authorizeAdmin, authorizeSeller, authorizeCustomer } from "./middleware/auth";
import { upload } from "./utils/fileUpload";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploads directory
  app.use("/uploads", express.static(uploadsDir));

  // Auth Routes
  // Admin Auth
  app.post("/api/auth/admin/login", authController.loginAdmin);
  app.post("/api/auth/admin/register", authController.registerAdmin);
  app.post("/api/auth/admin/reset-password", authController.resetAdminPassword);

  // Seller Auth
  app.post("/api/auth/seller/login", authController.loginSeller);
  app.post("/api/auth/seller/register", authController.registerSeller);
  app.post("/api/auth/seller/reset-password", authController.resetSellerPassword);

  // Customer Auth
  app.post("/api/auth/customer/register", authController.registerCustomer);
  app.post("/api/auth/customer/login", authController.loginCustomer);
  app.post("/api/auth/customer/reset-password", authController.resetCustomerPassword);

  // Admin Routes
  app.get("/api/admin/stats", authenticate, authorizeAdmin, adminController.getAdminStats);
  
  // Admin Seller Management
  app.post("/api/admin/sellers", authenticate, authorizeAdmin, adminController.createSeller);
  app.get("/api/admin/sellers", authenticate, authorizeAdmin, adminController.getAllSellers);
  app.get("/api/admin/sellers/:id", authenticate, authorizeAdmin, adminController.getSeller);
  app.put("/api/admin/sellers/:id", authenticate, authorizeAdmin, adminController.updateSeller);
  app.put("/api/admin/sellers/:id/approve", authenticate, authorizeAdmin, adminController.approveSeller);
  app.put("/api/admin/sellers/:id/reject", authenticate, authorizeAdmin, adminController.rejectSeller);
  
  // Admin Product Management
  app.get("/api/admin/products/pending", authenticate, authorizeAdmin, adminController.getPendingProducts);
  app.put("/api/admin/products/:id/approve", authenticate, authorizeAdmin, adminController.approveProduct);
  app.put("/api/admin/products/:id/reject", authenticate, authorizeAdmin, adminController.rejectProduct);
  app.delete("/api/admin/products/:id", authenticate, authorizeAdmin, adminController.deleteProduct);
  
  // Test routes (DEVELOPMENT ONLY)
  if (process.env.NODE_ENV === 'development') {
    // Test route for seller approval
    app.get("/api/test/approve-seller/:id", async (req, res) => {
      try {
        const sellerId = parseInt(req.params.id);
        const seller = await storage.getSeller(sellerId);
        
        if (!seller) {
          return res.status(404).json({ message: 'Seller not found' });
        }
        
        const updatedSeller = await storage.updateSeller(sellerId, { 
          approved: true, 
          rejected: false 
        });
        
        // Send approval notification email
        const { sendSellerApprovalEmail } = require('./utils/email');
        await sendSellerApprovalEmail(seller.email, seller.businessName);
        
        return res.status(200).json({
          message: 'Seller approved successfully',
          seller: updatedSeller
        });
      } catch (error) {
        console.error('Error in test route:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    });
    
    // Test route to create sample orders
    app.post("/api/test/create-orders", authenticate, authorizeCustomer, testDataController.createTestOrders);
  }
  
  // Admin Order Management
  app.get("/api/admin/orders", authenticate, authorizeAdmin, adminController.getAllOrders);
  app.get("/api/admin/orders/status/:status", authenticate, authorizeAdmin, adminController.getOrdersByStatus);
  app.put("/api/admin/orders/:id/tracking", authenticate, authorizeAdmin, adminController.addTrackingToOrder);

  // Seller Routes
  app.get("/api/seller/profile", authenticate, authorizeSeller, sellerController.getSellerProfile);
  app.put("/api/seller/profile", authenticate, authorizeSeller, sellerController.updateSellerProfile);
  app.get("/api/seller/stats", authenticate, authorizeSeller, sellerController.getSellerStats);
  
  // Seller Product Management
  app.get("/api/seller/products", authenticate, authorizeSeller, sellerController.getSellerProducts);
  app.post("/api/seller/products", authenticate, authorizeSeller, upload.single("image"), sellerController.createProduct);
  app.put("/api/seller/products/:id", authenticate, authorizeSeller, upload.single("image"), sellerController.updateProduct);
  app.delete("/api/seller/products/:id", authenticate, authorizeSeller, sellerController.deleteProduct);
  
  // Seller Order Management
  app.get("/api/seller/orders", authenticate, authorizeSeller, sellerController.getSellerOrders);
  app.put("/api/seller/orders/:id/ready", authenticate, authorizeSeller, sellerController.markOrderReady);

  // Customer Routes
  app.get("/api/customer/profile", authenticate, authorizeCustomer, customerController.getCustomerProfile);
  app.put("/api/customer/profile", authenticate, authorizeCustomer, customerController.updateCustomerProfile);
  
  // Customer Cart Management
  app.get("/api/customer/cart", authenticate, authorizeCustomer, customerController.getCart);
  app.post("/api/customer/cart", authenticate, authorizeCustomer, customerController.updateCart);
  
  // Customer Order Management
  app.post("/api/customer/orders", authenticate, authorizeCustomer, customerController.createOrder);
  app.get("/api/customer/orders", authenticate, authorizeCustomer, customerController.getCustomerOrders);
  app.get("/api/customer/orders/:id", authenticate, authorizeCustomer, customerController.getOrderDetails);

  // Product Routes (Public)
  app.get("/api/products", productController.getApprovedProducts);
  app.get("/api/products/search", productController.searchProducts);
  app.get("/api/products/category/:category", productController.getProductsByCategory);
  app.get("/api/products/:id", productController.getProductDetails);

  // Order Routes
  app.get("/api/orders/:id", authenticate, orderController.getOrderDetails);

  const httpServer = createServer(app);
  return httpServer;
}
