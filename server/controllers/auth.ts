import { Request, Response } from 'express';
import { storage } from '../storage';
import { hashPassword, comparePassword, generateRandomPassword } from '../utils/password';
import { generateToken } from '../middleware/auth';
import { insertUserSchema, insertSellerSchema, insertAdminSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';

// Admin auth controllers
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await storage.getAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await comparePassword(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: 'admin',
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const validatedData = insertAdminSchema.parse(req.body);
    
    const existingAdmin = await storage.getAdminByEmail(validatedData.email);
    if (existingAdmin) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await hashPassword(validatedData.password);
    
    const admin = await storage.createAdmin({
      ...validatedData,
      password: hashedPassword,
    });

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: 'admin',
    });

    await sendWelcomeEmail(admin.email, admin.email, 'admin');

    return res.status(201).json({
      message: 'Admin account created successfully',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Admin registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const resetAdminPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const admin = await storage.getAdminByEmail(email);
    if (!admin) {
      // Don't reveal user existence
      return res.status(200).json({ message: 'If the email exists, a password reset link will be sent' });
    }

    const newPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(newPassword);
    
    await storage.updateAdmin(admin.id, { password: hashedPassword });
    
    await sendPasswordResetEmail(admin.email, admin.email, newPassword, 'admin');

    return res.status(200).json({ message: 'If the email exists, a password reset link will be sent' });
  } catch (error) {
    console.error('Admin password reset error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Seller auth controllers
export const registerSeller = async (req: Request, res: Response) => {
  try {
    const validatedData = insertSellerSchema.parse(req.body);
    
    const existingUser = await storage.getSellerByEmail(validatedData.email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await hashPassword(validatedData.password);
    
    // Set status for seller accounts that need approval
    const seller = await storage.createSeller({
      ...validatedData,
      password: hashedPassword,
    });

    // Send welcome email to the seller
    await sendWelcomeEmail(seller.email, seller.businessName, 'seller');

    return res.status(201).json({
      message: 'Your seller application has been submitted for review',
      user: {
        id: seller.id,
        email: seller.email,
        businessName: seller.businessName,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Seller registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const loginSeller = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const seller = await storage.getSellerByEmail(email);
    if (!seller) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if the seller account is rejected
    if (seller.rejected) {
      return res.status(403).json({ 
        message: 'Your seller account has been rejected. Please contact support for more information.' 
      });
    }

    // Check if the seller account is approved
    if (!seller.approved) {
      return res.status(403).json({ 
        message: 'Your seller account is pending approval. You will be notified once approved.' 
      });
    }

    const passwordMatch = await comparePassword(password, seller.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      id: seller.id,
      email: seller.email,
      role: 'seller',
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: seller.id,
        email: seller.email,
        businessName: seller.businessName,
        role: 'seller',
      },
    });
  } catch (error) {
    console.error('Seller login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const resetSellerPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const seller = await storage.getSellerByEmail(email);
    if (!seller) {
      // Don't reveal user existence
      return res.status(200).json({ message: 'If the email exists, a password reset will be sent' });
    }

    const newPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(newPassword);
    
    await storage.updateSeller(seller.id, { password: hashedPassword });
    
    await sendPasswordResetEmail(seller.email, seller.businessName, newPassword, 'seller');

    return res.status(200).json({ message: 'If the email exists, a password reset will be sent' });
  } catch (error) {
    console.error('Seller password reset error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Customer auth controllers
export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await hashPassword(validatedData.password);
    
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword,
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: 'customer',
    });

    await sendWelcomeEmail(user.email, user.name, 'customer');

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'customer',
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Customer registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const loginCustomer = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: 'customer',
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'customer',
      },
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const resetCustomerPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal user existence
      return res.status(200).json({ message: 'If the email exists, a password reset will be sent' });
    }

    const newPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(newPassword);
    
    await storage.updateUser(user.id, { password: hashedPassword });
    
    await sendPasswordResetEmail(user.email, user.name, newPassword, 'customer');

    return res.status(200).json({ message: 'If the email exists, a password reset will be sent' });
  } catch (error) {
    console.error('Customer password reset error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
