import { storage } from "./storage";
import { hashPassword } from "./utils/password";
import { db } from "./db";

async function addUser() {
  try {
    console.log("Adding user with email: memuplaypubg3@gmail.com");
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail("memuplaypubg3@gmail.com");
    
    if (existingUser) {
      console.log("User already exists, updating password...");
      const hashedPassword = await hashPassword("123456");
      await storage.updateUser(existingUser.id, { password: hashedPassword });
      console.log("Password updated successfully!");
    } else {
      console.log("Creating new user...");
      const hashedPassword = await hashPassword("123456");
      
      const newUser = await storage.createUser({
        email: "memuplaypubg3@gmail.com",
        password: hashedPassword,
        name: "Test User",
      });
      
      console.log("User created successfully with ID:", newUser.id);
    }
    
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding user:", error);
    process.exit(1);
  }
}

// Execute the function
addUser();