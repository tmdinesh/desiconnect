import { Request, Response } from 'express';
import { storage } from '../storage';
import { hashPassword } from '../utils/password';
import { insertSellerSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { sendWelcomeEmail, sendSellerApprovalEmail, sendSellerRejectionEmail } from '../utils/email';

// Order management
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const allOrders = await storage.getAllOrders();

    const ordersWithDetails = await Promise.all(
      allOrders.map(async (order) => {
        const product = await storage.getProduct(order.productId);
        const seller = product ? await storage.getSeller(product.sellerId) : null;
        const user = await storage.getUser(order.userId);

        return {
          ...order,
          product,
          seller,
          user,
          totalPrice: Number(order.totalPrice),
          formattedPrice: Number(order.totalPrice).toFixed(2),
        };
      })
    );

    return res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
