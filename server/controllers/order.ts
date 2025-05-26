import { Request, Response } from 'express';
import { storage } from '../storage';

// Get order details
export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check permissions based on user role
    if (req.user) {
      if (req.user.role === 'customer' && order.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      } else if (req.user.role === 'seller' && order.sellerId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Fetch related data
    const product = await storage.getProduct(order.productId);
    const seller = await storage.getSeller(order.sellerId);
    const user = await storage.getUser(order.userId);
    
    const orderDetails = {
      ...order,
      product: product ? { 
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      } : null,
      seller: seller ? { 
        id: seller.id, 
        businessName: seller.businessName 
      } : null,
      customer: user ? { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      } : null,
    };
    
    return res.status(200).json(orderDetails);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
