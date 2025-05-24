import { Request, Response } from 'express';
import { storage } from '../storage';
import { hashPassword } from '../utils/password';
import { getFileUrl } from '../utils/fileUpload';
import { insertProductSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Get seller profile
export const getSellerProfile = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user?.id as number;
    const seller = await storage.getSeller(sellerId);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    // Remove sensitive information
    const { password, ...sellerData } = seller;
    
    return res.status(200).json(sellerData);
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update seller profile
export const updateSellerProfile = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user?.id as number;
    const seller = await storage.getSeller(sellerId);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    const { currentPassword, newPassword, ...profileData } = req.body;
    
    // Validate and update the profile data
    let updatedData: any = {};
    
    // Update allowed fields from profile data
    if (profileData.businessName) updatedData.businessName = profileData.businessName;
    if (profileData.warehouseAddress) updatedData.warehouseAddress = profileData.warehouseAddress;
    if (profileData.businessAddress) updatedData.businessAddress = profileData.businessAddress;
    if (profileData.zipCode) updatedData.zipCode = profileData.zipCode;
    if (profileData.phone) updatedData.phone = profileData.phone;
    if (profileData.gst) updatedData.gst = profileData.gst;
    
    // Handle password change if requested
    if (newPassword && currentPassword) {
      // Validate current password
      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(currentPassword, seller.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Hash the new password
      updatedData.password = await hashPassword(newPassword);
    }
    
    // Update the seller profile
    const updatedSeller = await storage.updateSeller(sellerId, updatedData);
    
    // Remove sensitive data for response
    const { password, ...sellerData } = updatedSeller!;
    
    return res.status(200).json({
      message: 'Profile updated successfully',
      seller: sellerData,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error updating seller profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get seller dashboard stats
export const getSellerStats = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user?.id as number;
    
    // Get all products for the seller
    const products = await storage.getProductsBySeller(sellerId);
    
    // Get all orders for the seller
    const orders = await storage.getOrdersBySeller(sellerId);
    
    // Calculate stats
    const totalProducts = products.length;
    const pendingApprovals = products.filter(p => p.status === 'pending').length;
    const newOrders = orders.filter(o => o.status === 'placed').length;
    
    // Calculate revenue from fulfilled orders
    const totalRevenue = orders
      .filter(o => o.status === 'fulfilled')
      .reduce((sum, order) => sum + parseFloat(String(order.totalPrice)), 0);
    
    return res.status(200).json({
      totalProducts,
      pendingApprovals,
      newOrders,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Product management
export const getSellerProducts = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user?.id as number;
    const products = await storage.getProductsBySeller(sellerId);
    
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user?.id as number;
    
    // Handle file upload
    let imagePath = '';
    if (req.file) {
      imagePath = getFileUrl(req.file.filename);
    }
    
    // Validate product data
    const productData = {
      ...req.body,
      price: req.body.price, // Keep price as string
      quantity: parseInt(req.body.quantity),
      sellerId,
    };
    
    // Add image path if file was uploaded
    if (imagePath) {
      productData.image = imagePath;
    }
    
    const validatedData = insertProductSchema.parse(productData);
    
    // Create the product
    const product = await storage.createProduct(validatedData);
    
    return res.status(201).json({
      message: 'Product created successfully and pending approval',
      product,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const sellerId = req.user?.id as number;
    
    // Verify product exists and belongs to seller
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.sellerId !== sellerId) {
      return res.status(403).json({ message: 'You do not have permission to update this product' });
    }
    
    // Handle file upload
    let imagePath = '';
    if (req.file) {
      imagePath = getFileUrl(req.file.filename);
    }
    
    // Prepare update data
    let updateData: any = {};
    
    // Update allowed fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.price) updateData.price = req.body.price; // Keep price as string
    if (req.body.quantity) updateData.quantity = parseInt(req.body.quantity);
    
    // Add image path if file was uploaded
    if (imagePath) {
      updateData.image = imagePath;
    }
    
    // Update status to pending if significant changes were made
    if (updateData.name || updateData.description || updateData.price || updateData.image) {
      updateData.status = 'pending';
    }
    
    // Update the product
    const updatedProduct = await storage.updateProduct(productId, updateData);
    
    return res.status(200).json({
      message: product.status === 'pending' || updateData.status === 'pending' 
        ? 'Product updated successfully and pending approval'
        : 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const sellerId = req.user?.id as number;
    
    // Verify product exists and belongs to seller
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.sellerId !== sellerId) {
      return res.status(403).json({ message: 'You do not have permission to delete this product' });
    }
    
    // Delete the product
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
export const getSellerOrders = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user?.id as number;
    const orders = await storage.getOrdersBySeller(sellerId);
    
    // Fetch product information for each order
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const product = await storage.getProduct(order.productId);
        return {
          ...order,
          product: product || { name: 'Unknown Product' },
        };
      })
    );
    
    return res.status(200).json(ordersWithProducts);
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const markOrderReady = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const sellerId = req.user?.id as number;
    
    // Verify order exists and belongs to seller
    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.sellerId !== sellerId) {
      return res.status(403).json({ message: 'You do not have permission to update this order' });
    }
    
    if (order.status !== 'placed') {
      return res.status(400).json({ message: 'Order is not in the placed status' });
    }
    
    // Update order status to ready
    const updatedOrder = await storage.updateOrderStatus(orderId, 'ready');
    
    return res.status(200).json({
      message: 'Order marked as ready for pickup',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error marking order as ready:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
