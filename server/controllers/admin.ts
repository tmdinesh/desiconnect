import { Request, Response } from 'express';
import { storage } from '../storage';
import { hashPassword } from '../utils/password';
import { insertSellerSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { sendWelcomeEmail, sendSellerApprovalEmail, sendSellerRejectionEmail } from '../utils/email';

// Get admin dashboard stats
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const sellers = await storage.getAllSellers();
    const pendingProducts = await storage.getPendingProducts();
    const readyOrders = await storage.getOrdersByStatus('ready');
    
    // Calculate total revenue from fulfilled orders
    const allOrders = await storage.getAllOrders();
    const fulfilledOrders = allOrders.filter(order => order.status === 'fulfilled');
    
    const totalRevenue = fulfilledOrders.reduce((sum, order) => {
      return sum + parseFloat(String(order.totalPrice));
    }, 0);

    return res.status(200).json({
      totalSellers: sellers.length,
      pendingProducts: pendingProducts.length,
      readyOrders: readyOrders.length,
      totalRevenue: totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Seller CRUD operations
export const createSeller = async (req: Request, res: Response) => {
  try {
    const validatedData = insertSellerSchema.parse(req.body);
    
    const existingSeller = await storage.getSellerByEmail(validatedData.email);
    if (existingSeller) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Set the admin ID from the authenticated admin
    const adminId = req.user?.id;
    
    // Generate a default password or use the provided one
    const password = validatedData.password || Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(password);
    
    const seller = await storage.createSeller({
      ...validatedData,
      adminId,
      password: hashedPassword,
    });

    // Send welcome email with login credentials
    await sendWelcomeEmail(seller.email, seller.businessName, 'seller');

    return res.status(201).json({
      message: 'Seller account created successfully',
      seller: {
        id: seller.id,
        email: seller.email,
        businessName: seller.businessName,
      },
      // Only include the password in the response if it was auto-generated
      ...(validatedData.password ? {} : { password }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error creating seller:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAllSellers = async (req: Request, res: Response) => {
  try {
    const sellers = await storage.getAllSellers();
    return res.status(200).json(sellers);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getSeller = async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.id);
    const seller = await storage.getSeller(sellerId);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    return res.status(200).json(seller);
  } catch (error) {
    console.error('Error fetching seller:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateSeller = async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.id);
    const seller = await storage.getSeller(sellerId);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    // Only update the allowed fields
    const validatedData = insertSellerSchema.partial().parse(req.body);
    
    // Handle password separately if provided
    let updatedData = { ...validatedData };
    if (validatedData.password) {
      updatedData.password = await hashPassword(validatedData.password);
    }
    
    const updatedSeller = await storage.updateSeller(sellerId, updatedData);
    
    return res.status(200).json({
      message: 'Seller updated successfully',
      seller: updatedSeller,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error updating seller:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Product approval operations
export const getPendingProducts = async (req: Request, res: Response) => {
  try {
    const pendingProducts = await storage.getPendingProducts();
    
    // Fetch seller information for each product
    const productsWithSellerInfo = await Promise.all(
      pendingProducts.map(async (product) => {
        const seller = await storage.getSeller(product.sellerId);
        return {
          ...product,
          sellerBusinessName: seller?.businessName || 'Unknown Seller',
        };
      })
    );
    
    return res.status(200).json(productsWithSellerInfo);
  } catch (error) {
    console.error('Error fetching pending products:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const approveProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.status !== 'pending') {
      return res.status(400).json({ message: 'Product is not pending approval' });
    }
    
    const updatedProduct = await storage.updateProductStatus(productId, 'approved');
    
    return res.status(200).json({
      message: 'Product approved successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error approving product:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const rejectProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.status !== 'pending') {
      return res.status(400).json({ message: 'Product is not pending approval' });
    }
    
    const updatedProduct = await storage.updateProductStatus(productId, 'rejected');
    
    return res.status(200).json({
      message: 'Product rejected successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error rejecting product:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if the product is referenced in any orders
    const orders = await storage.getAllOrders();
    const productInOrders = orders.some(order => order.productId === productId);
    
    if (productInOrders) {
      return res.status(400).json({ 
        message: 'Cannot delete product that is referenced in orders. Consider deactivating it instead.' 
      });
    }
    
    await storage.deleteProduct(productId);
    
    return res.status(200).json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Order management
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const allOrders = await storage.getAllOrders();
    
    // Fetch product and seller information for each order
    const ordersWithDetails = await Promise.all(
      allOrders.map(async (order) => {
        const product = await storage.getProduct(order.productId);
        const seller = await storage.getSeller(order.sellerId);
        
        // Convert database field to a plain number to avoid serialization issues
        const formattedPrice = Number(order.totalPrice);
        
        return {
          ...order,
          productName: product?.name || 'Unknown Product',
          sellerBusinessName: seller?.businessName || 'Unknown Seller',
          // Ensure price data is consistent and accessible
          totalPrice: formattedPrice,
          formattedPrice: formattedPrice.toFixed(2)
        };
      })
    );
    
    return res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getOrdersByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    
    if (!['placed', 'ready', 'fulfilled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status parameter' });
    }
    
    const orders = await storage.getOrdersByStatus(status as 'placed' | 'ready' | 'fulfilled');
    
    // Fetch product and seller information for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const product = await storage.getProduct(order.productId);
        const seller = await storage.getSeller(order.sellerId);
        return {
          ...order,
          productName: product?.name || 'Unknown Product',
          sellerBusinessName: seller?.businessName || 'Unknown Seller',
          // Convert database field to a plain number to avoid serialization issues
          totalPrice: Number(order.totalPrice),
          formattedPrice: Number(order.totalPrice).toFixed(2)
        };
      })
    );
    
    return res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error(`Error fetching orders with status ${req.params.status}:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const addTrackingToOrder = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { trackingNumber } = req.body;
    
    if (!trackingNumber) {
      return res.status(400).json({ message: 'Tracking number is required' });
    }
    
    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status !== 'ready') {
      return res.status(400).json({ message: 'Order is not ready for fulfillment' });
    }
    
    const updatedOrder = await storage.updateOrderTracking(orderId, trackingNumber);
    
    return res.status(200).json({
      message: 'Order fulfilled with tracking number',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error adding tracking to order:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Seller approval/rejection operations
export const approveSeller = async (req: Request, res: Response) => {
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
    
    return res.status(200).json({
      message: 'Seller approved successfully',
      seller: updatedSeller
    });
  } catch (error) {
    console.error('Error approving seller:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const rejectSeller = async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.id);
    const seller = await storage.getSeller(sellerId);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    const updatedSeller = await storage.updateSeller(sellerId, { 
      approved: false, 
      rejected: true 
    });
    
    return res.status(200).json({
      message: 'Seller rejected successfully',
      seller: updatedSeller
    });
  } catch (error) {
    console.error('Error rejecting seller:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
