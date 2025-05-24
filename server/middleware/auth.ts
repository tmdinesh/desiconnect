import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

// Define interface for JWT payload
interface JwtPayload {
  id: number;
  email: string;
  role: 'admin' | 'seller' | 'customer';
}

// Extend Express Request interface with user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// Authentication middleware to verify JWT token
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Format should be 'Bearer [token]'
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Authentication format invalid' });
    }
    
    const token = parts[1];
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Attach user payload to request object
    req.user = decoded;
    
    // Log successful authentication for debugging
    console.log(`Authenticated user: ${decoded.email} (${decoded.role})`);
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Authorization middleware for admin role
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin permission required.' });
  }
  next();
};

// Authorization middleware for seller role
export const authorizeSeller = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Access denied. Seller permission required.' });
  }
  next();
};

// Authorization middleware for customer role
export const authorizeCustomer = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Access denied. Customer permission required.' });
  }
  next();
};

// Verify seller ownership of products and orders
export const verifySellerOwnership = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const resourceId = parseInt(req.params.id);
  const resourceType = req.baseUrl.includes('products') ? 'product' : 'order';

  try {
    if (resourceType === 'product') {
      const product = await storage.getProduct(resourceId);
      if (!product || product.sellerId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to access this product' });
      }
    } else if (resourceType === 'order') {
      const order = await storage.getOrder(resourceId);
      if (!order || order.sellerId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to access this order' });
      }
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error while verifying ownership' });
  }
};

// Verify customer ownership of orders
export const verifyCustomerOwnership = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const orderId = parseInt(req.params.id);

  try {
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to access this order' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error while verifying ownership' });
  }
};
