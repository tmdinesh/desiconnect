import { storage } from '../storage';
import { hashPassword } from './password';
import { logger } from './logger';

/**
 * Creates a default admin account if none exists
 * This allows initial access to the platform for administration
 */
export const createDefaultAdmin = async (): Promise<void> => {
  try {
    logger.info('Checking for default admin account...');
    
    // Check if any admin exists in the system
    const admins = await storage.getAllAdmins();
    
    if (admins.length === 0) {
      // If no admins exist, create a default one
      logger.info('No admin accounts found. Creating default admin...');
      
      const defaultEmail = 'admin@desiconnect.com';
      const defaultPassword = 'Admin@123'; // Users will be prompted to change this on first login
      const hashedPassword = await hashPassword(defaultPassword);
      
      await storage.createAdmin({
        email: defaultEmail,
        password: hashedPassword,
        name: 'Default Admin'
      });
      
      logger.info(`Default admin created with email: ${defaultEmail}`);
      logger.info(`Default password: ${defaultPassword}`);
      logger.info('Please change this password after first login!');
    } else {
      logger.info(`${admins.length} admin account(s) already exist. No default admin needed.`);
    }
  } catch (error) {
    logger.error('Failed to create default admin:', error);
    throw error;
  }
};