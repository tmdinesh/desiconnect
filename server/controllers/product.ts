import { Request, Response } from 'express';
import { storage } from '../storage';

// Get all approved products
export const getApprovedProducts = async (req: Request, res: Response) => {
  try {
    const products = await storage.getApprovedProducts();
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching approved products:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get products by category
export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const products = await storage.getProductsByCategory(category);
    return res.status(200).json(products);
  } catch (error) {
    console.error(`Error fetching products by category ${req.params.category}:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get product details
export const getProductDetails = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // For public API, only return approved products
    if (product.status !== 'approved' && (!req.user || req.user.role === 'customer')) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Fetch seller information
    const seller = await storage.getSeller(product.sellerId);
    
    return res.status(200).json({
      ...product,
      seller: seller ? { id: seller.id, businessName: seller.businessName } : null,
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Search products
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    console.log('Searching products with query:', query);
    const products = await storage.searchProducts(query);
    console.log('Found products:', products.length);
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
