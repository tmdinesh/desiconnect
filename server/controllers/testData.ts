import { Request, Response } from 'express';
import { storage } from '../storage';
import { randomUUID } from 'crypto';

/**
 * Creates test data for demonstration purposes
 * This is only used in development to quickly set up test data
 */
export const createTestOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as number;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get products to use for test orders
    const products = await storage.getApprovedProducts();
    
    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'No products available to create test orders' });
    }
    
    // Create a few test orders with different statuses
    const orders = [];
    
    // Sample addresses for test orders
    const addresses = [
      '123 Main Street, Mumbai, Maharashtra 400001',
      '45 Park Avenue, Delhi, Delhi 110001',
      '789 Garden Road, Bangalore, Karnataka 560001'
    ];
    
    // Order 1 - Placed
    if (products[0]) {
      const order1 = await storage.createOrder({
        productId: products[0].id,
        sellerId: products[0].sellerId,
        userId,
        customerName: user.name || 'Customer',
        address: addresses[0],
        quantity: 1,
        totalPrice: String(products[0].price),
        status: 'placed',
        customerMessage: 'Please deliver it as soon as possible',
      });
      orders.push(order1);
    }
    
    // Order 2 - Ready
    if (products.length > 1 && products[1]) {
      const order2 = await storage.createOrder({
        productId: products[1].id,
        sellerId: products[1].sellerId,
        userId,
        customerName: user.name || 'Customer',
        address: addresses[1],
        quantity: 2,
        totalPrice: String(parseFloat(String(products[1].price)) * 2),
        status: 'ready',
        trackingNumber: `TR-${randomUUID().substring(0, 8).toUpperCase()}`,
      });
      orders.push(order2);
    }
    
    // Order 3 - Fulfilled
    if (products.length > 2 && products[2]) {
      const order3 = await storage.createOrder({
        productId: products[2].id,
        sellerId: products[2].sellerId,
        userId,
        customerName: user.name || 'Customer',
        address: addresses[2],
        quantity: 1,
        totalPrice: String(products[2].price),
        status: 'fulfilled',
        trackingNumber: `TR-${randomUUID().substring(0, 8).toUpperCase()}`,
      });
      orders.push(order3);
    }
    
    // Use first product if we don't have enough products
    if (orders.length < 3 && products[0]) {
      const order4 = await storage.createOrder({
        productId: products[0].id,
        sellerId: products[0].sellerId,
        userId,
        customerName: user.name || 'Customer',
        address: addresses[2],
        quantity: 3,
        totalPrice: String(parseFloat(String(products[0].price)) * 3),
        status: 'fulfilled',
        trackingNumber: `TR-${randomUUID().substring(0, 8).toUpperCase()}`,
      });
      orders.push(order4);
    }
    
    return res.status(200).json({
      message: `Created ${orders.length} test orders successfully`,
      orders
    });
  } catch (error) {
    console.error('Error creating test orders:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};