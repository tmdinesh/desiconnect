import { Request, Response } from 'express';
import { storage } from '../storage';
import { hashPassword } from '../utils/password';
import { updateCartSchema, insertOrderSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Get customer profile
export const getCustomerProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as number;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive information
    const { password, ...userData } = user;
    
    return res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update customer profile
export const updateCustomerProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as number;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { currentPassword, newPassword, ...profileData } = req.body;
    
    // Validate and update the profile data
    let updatedData: any = {};
    
    // Update allowed fields from profile data
    if (profileData.name) updatedData.name = profileData.name;
    if (profileData.address) updatedData.address = profileData.address;
    
    // Handle password change if requested
    if (newPassword && currentPassword) {
      // Validate current password
      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Hash the new password
      updatedData.password = await hashPassword(newPassword);
    }
    
    // Update the user profile
    const updatedUser = await storage.updateUser(userId, updatedData);
    
    // Remove sensitive data for response
    const { password, ...userData } = updatedUser!;
    
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Cart management
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as number;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If no cart data, return empty array
    if (!user.cartData) {
      return res.status(200).json({ items: [] });
    }
    
    // Fetch product details for each cart item
    const cartItems = await Promise.all(
      (user.cartData.items || []).map(async (item) => {
        const product = await storage.getProduct(item.productId);
        return {
          ...item,
          product: product || { name: 'Product not available', price: 0 },
        };
      })
    );
    
    return res.status(200).json({ items: cartItems });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as number;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate cart data
    const validatedData = updateCartSchema.parse(req.body);
    
    // Ensure all products exist and are approved
    for (const item of validatedData.items) {
      const product = await storage.getProduct(item.productId);
      
      if (!product) {
        return res.status(400).json({ message: `Product with ID ${item.productId} not found` });
      }
      
      if (product.status !== 'approved') {
        return res.status(400).json({ message: `Product ${product.name} is not available for purchase` });
      }
      
      if (item.quantity > product.quantity) {
        return res.status(400).json({ message: `Not enough quantity available for ${product.name}` });
      }
    }
    
    // Update cart data
    const updatedUser = await storage.updateUserCart(userId, validatedData);
    
    return res.status(200).json({
      message: 'Cart updated successfully',
      cart: updatedUser?.cartData,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error updating cart:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Order management
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as number;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify cart has items
    if (!user.cartData || !user.cartData.items || user.cartData.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ message: 'Delivery address is required' });
    }
    
    // Create orders for each item in cart
    const createdOrders = [];
    
    for (const item of user.cartData.items) {
      const product = await storage.getProduct(item.productId);
      
      if (!product) {
        return res.status(400).json({ message: `Product with ID ${item.productId} not found` });
      }
      
      if (product.status !== 'approved') {
        return res.status(400).json({ message: `Product ${product.name} is not available for purchase` });
      }
      
      if (item.quantity > product.quantity) {
        return res.status(400).json({ message: `Not enough quantity available for ${product.name}` });
      }
      
      // Perform a final check of inventory quantity
      const latestProduct = await storage.getProduct(item.productId);
      
      // Verify the product is still in stock with the requested quantity 
      if (!latestProduct || latestProduct.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Product ${product.name} inventory has changed. Only ${latestProduct?.quantity || 0} units available.` 
        });
      }
      
      // Calculate total price
      const totalPrice = (parseFloat(String(product.price)) * item.quantity).toString();
      
      // Generate a tracking ID (format: TR-randomstring-date)
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const trackingId = `TR-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${date}`;
      
      // Create order with tracking ID
      const orderData = {
        productId: product.id,
        sellerId: product.sellerId,
        userId,
        customerName: user.name || 'Customer',
        address,
        quantity: item.quantity,
        totalPrice,
        customerMessage: item.message || '',
        status: 'placed' as const,
        trackingNumber: trackingId,
      };
      
      const order = await storage.createOrder(orderData);
      createdOrders.push(order);
      
      // Update product quantity
      const newQuantity = product.quantity - item.quantity;
      await storage.updateProduct(product.id, {
        quantity: newQuantity,
      });
      
      console.log(`Inventory updated for product ${product.id}. New quantity: ${newQuantity}`);
    }
    
    // Clear the cart
    await storage.updateUserCart(userId, { items: [] });
    
    return res.status(201).json({
      message: 'Orders placed successfully',
      orders: createdOrders,
    });
  } catch (error) {
    console.error('Error creating orders:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as number;
    const orders = await storage.getOrdersByUser(userId);
    
    // Fetch product and seller details for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const product = await storage.getProduct(order.productId);
        const seller = await storage.getSeller(order.sellerId);
        
        return {
          ...order,
          product: product || { name: 'Product not available' },
          seller: seller ? { businessName: seller.businessName } : { businessName: 'Unknown Seller' },
        };
      })
    );
    
    return res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user?.id as number;
    
    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to view this order' });
    }
    
    // Fetch product and seller details
    const product = await storage.getProduct(order.productId);
    const seller = await storage.getSeller(order.sellerId);
    
    const orderWithDetails = {
      ...order,
      product: product || { name: 'Product not available' },
      seller: seller ? { businessName: seller.businessName } : { businessName: 'Unknown Seller' },
    };
    
    return res.status(200).json(orderWithDetails);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
