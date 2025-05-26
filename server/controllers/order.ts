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

    // Check role-based access
    if (req.user) {
      if (req.user.role === 'customer' && order.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      } else if (req.user.role === 'seller' && order.sellerId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const product = await storage.getProduct(order.productId);
    const seller = await storage.getSeller(order.sellerId);
    const user = await storage.getUser(order.userId);

    const orderDetails = {
      ...order,
      product: product ? {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        category: product.category,
        sellerId: product.sellerId,
      } : null,
      seller: seller ? {
        id: seller.id,
        businessName: seller.businessName,
        email: seller.email,
        phone: seller.phone,
        gst: seller.gst,
        businessAddress: seller.businessAddress,
        warehouseAddress: seller.warehouseAddress,
        zipCode: seller.zipCode,
      } : null,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
      } : null,
      formattedPrice: Number(order.totalPrice).toFixed(2),
      totalPrice: Number(order.totalPrice),
    };

    return res.status(200).json(orderDetails);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
