import { storage } from "../storage";
import { logger } from "./logger";
import { hashPassword } from "./password";

/**
 * Creates a default customer account for testing purposes
 * This allows initial access to the customer features of the platform
 */
export const createDefaultCustomer = async (): Promise<void> => {
  logger.info("Checking for default customer account...");
  
  // For simplicity in creating a default customer, we'll just check for a known email
  const existingCustomer = await storage.getUserByEmail("customer@desiconnect.com");
  
  if (existingCustomer) {
    logger.info("Default customer account already exists. No need to create another.");
    return;
  }

  // Create a default customer account
  const defaultPassword = await hashPassword("Customer@123");
  
  try {
    const customer = await storage.createUser({
      email: "customer@desiconnect.com",
      password: defaultPassword,
      name: "Test Customer", 
      address: "123 Test Street, Test City",
    });
    
    // Initialize empty cart for customer
    await storage.updateUserCart(customer.id, JSON.stringify({ items: [] }));
    
    logger.info("Default customer account created successfully");
  } catch (error) {
    logger.error(`Failed to create default customer account: ${error}`);
    throw error;
  }
};