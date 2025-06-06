import { createServer } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { emailService } from "./email-service.js";

const scryptAsync = promisify(scrypt);

// Password hashing functions
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64));
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(app) {
  // Setup authentication routes first
  setupAuth(app);

  // Update user settings (must come before /api/user/:id to avoid route conflict)
  app.put("/api/user/settings", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { settings } = req.body;
      const updatedUser = await storage.updateUser(req.user.id, { settings });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // User profile update endpoint
  app.put("/api/user/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id);
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized to update this profile" });
      }

      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Profile image upload endpoint
  app.post("/api/user/:id/upload-image", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id);
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized to update this profile" });
      }

      const { imageData, fileName, fileSize } = req.body;
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (fileSize > maxSize) {
        return res.status(413).json({ message: "File size exceeds 5MB limit" });
      }

      // In a real implementation, you would save the file to disk or cloud storage
      // For now, we'll simulate successful upload and store a reference
      const imageUrl = `/uploads/profile-images/user-${userId}-${Date.now()}.jpg`;
      
      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: imageUrl
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Categories endpoints
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Products endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error.message && error.message.includes("unique")) {
        res.status(400).json({ message: "Product with this SKU already exists" });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedProduct = await storage.updateProduct(id, req.body);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error.message && error.message.includes("unique")) {
        res.status(400).json({ message: "Product with this SKU already exists" });
      } else {
        res.status(500).json({ message: "Failed to update product" });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Stock transactions endpoints
  app.get("/api/stock-transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllStockTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching stock transactions:", error);
      res.status(500).json({ message: "Failed to fetch stock transactions" });
    }
  });

  app.post("/api/stock-transactions", async (req, res) => {
    try {
      const userId = 1; // System user
      
      if (!req.body.productId || !req.body.type || !req.body.quantity) {
        return res.status(400).json({ 
          message: "Missing required fields: productId, type, and quantity are required" 
        });
      }
      
      const transactionData = {
        ...req.body,
        userId: userId,
        reason: req.body.reason || null,
        batchNumber: req.body.batchNumber || null,
        expiryDate: req.body.expiryDate || null,
        status: req.body.status || "pending"
      };
      
      const newTransaction = await storage.createStockTransaction(transactionData);
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error("Error creating stock transaction:", error);
      res.status(500).json({ message: "Failed to create stock transaction" });
    }
  });
  
  // Process a pending stock transaction (supplier order)
  app.post("/api/stock-transactions/process", async (req, res) => {
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ message: "Transaction ID is required" });
      }
      
      const transaction = await storage.getStockTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      const product = await storage.getProduct(transaction.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      await storage.updateStockTransaction(id, { status: "completed" });
      
      // Stock is now managed by the batch system, no need to manually update here
      // The createStockTransaction method already handles stock calculations based on batches
      
      res.status(200).json({ message: "Transaction processed successfully" });
    } catch (error) {
      console.error("Error processing transaction:", error);
      res.status(500).json({ message: "Failed to process transaction" });
    }
  });
  
  // Delete a pending stock transaction (cancel supplier order)
  app.delete("/api/stock-transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const transaction = await storage.getStockTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.status !== "pending") {
        return res.status(400).json({ message: "Only pending transactions can be canceled" });
      }
      
      await storage.deleteStockTransaction(id);
      
      res.status(200).json({ message: "Transaction canceled successfully" });
    } catch (error) {
      console.error("Error canceling transaction:", error);
      res.status(500).json({ message: "Failed to cancel transaction" });
    }
  });

  // Orders endpoints
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { orderItems, customerName, customerContact, status = "pending" } = req.body;
      
      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ message: "Order items are required" });
      }
      
      let totalAmount = 0;
      
      // Calculate total amount and validate stock
      for (const item of orderItems) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
        }
        
        if (product.currentStock < item.quantity) {
          return res.status(400).json({ 
            message: `Not enough stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}` 
          });
        }
        
        totalAmount += product.price * item.quantity;
      }
      
      const orderData = {
        orderNumber: `ORD-${Date.now()}`,
        customerId: null,
        totalAmount: totalAmount,
        status: status,
        notes: `Customer: ${customerName || "Unknown"}, Contact: ${customerContact || "N/A"}`
      };
      
      const order = await storage.createOrder(orderData, orderItems);
      
      // Create stock transactions for each item
      for (const item of orderItems) {
        const product = await storage.getProduct(item.productId);
        await storage.createStockTransaction({
          productId: item.productId,
          type: "out",
          quantity: item.quantity,
          userId: 1,
          reason: `Order ${order.orderNumber}`
        });
        
        // Update product stock
        await storage.updateProduct(item.productId, { 
          currentStock: product.currentStock - item.quantity 
        });
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Dashboard endpoints
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [totalProducts, lowStockItems, expiringProducts, totalOrders, recentActivity] = await Promise.all([
        storage.getTotalProducts(),
        storage.getLowStockItems(),
        storage.getExpiringProducts(),
        storage.getTotalOrders(),
        storage.getRecentActivity()
      ]);

      res.json({
        totalProducts,
        lowStockCount: lowStockItems.length,
        expiringCount: expiringProducts.length,
        totalOrders,
        lowStockItems,
        expiringProducts,
        recentActivity
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // User profile self-update endpoint (excludes role changes)
  app.patch("/api/user/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      const updateData = { ...req.body };
      
      // Remove role from update data - role can only be changed through admin panel
      delete updateData.role;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin user management endpoints
  // Get all users (admin only)
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user (admin only)
  app.post("/api/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { username, fullName, email, password, position, role } = req.body;
      
      // Validate role - only allow "admin" or "user"
      if (role && role !== "admin" && role !== "user") {
        return res.status(400).json({ message: "Role must be either 'admin' or 'user'" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const salt = randomBytes(16).toString("hex");
      const hashedPassword = (await scryptAsync(password, salt, 64)).toString("hex") + "." + salt;
      
      const newUser = await storage.createUser({
        username,
        fullName: fullName || username,
        email: email || `${username}@example.com`,
        password: hashedPassword,
        position: position || null,
        role: role || "user",
        profileImageUrl: null
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user (admin only)
  app.patch("/api/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = parseInt(req.params.id);
      const updateData = { ...req.body };
      
      // Get the user being updated
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Role validation: prevent last admin from becoming user
      if (targetUser.role === "admin" && updateData.role === "user") {
        const allUsers = await storage.getAllUsers();
        const adminCount = allUsers.filter(u => u.role === "admin").length;
        if (adminCount <= 1) {
          return res.status(400).json({ 
            message: "Cannot change role to user. At least one admin must remain in the company." 
          });
        }
      }
      
      // Validate role if being updated
      if (updateData.role && updateData.role !== "admin" && updateData.role !== "user") {
        return res.status(400).json({ message: "Role must be either 'admin' or 'user'" });
      }
      
      // If password is being updated, hash it
      if (updateData.password) {
        const salt = randomBytes(16).toString("hex");
        updateData.password = (await scryptAsync(updateData.password, salt, 64)).toString("hex") + "." + salt;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = parseInt(req.params.id);
      
      // Prevent deleting self
      if (req.user.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Batch Inventory Management endpoints
  app.get("/api/inventory-batches", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const batches = await storage.getAllInventoryBatches();
      res.json(batches);
    } catch (error) {
      console.error("Error fetching inventory batches:", error);
      res.status(500).json({ message: "Failed to fetch inventory batches" });
    }
  });

  app.get("/api/inventory-batches/product/:productId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const productId = parseInt(req.params.productId);
      const batches = await storage.getInventoryBatchesByProduct(productId);
      res.json(batches);
    } catch (error) {
      console.error("Error fetching product batches:", error);
      res.status(500).json({ message: "Failed to fetch product batches" });
    }
  });

  app.get("/api/inventory-batches/expiring", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const daysAhead = parseInt(req.query.days) || 30;
      const expiringBatches = await storage.getExpiringBatches(daysAhead);
      res.json(expiringBatches);
    } catch (error) {
      console.error("Error fetching expiring batches:", error);
      res.status(500).json({ message: "Failed to fetch expiring batches" });
    }
  });

  // 2FA Enable endpoint - enables email-based 2FA
  app.post("/api/2fa/enable", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        randomBytes(4).toString('hex').toUpperCase()
      );

      // Enable 2FA for user
      await storage.updateUserTwoFactor(req.user.id, {
        twoFactorEnabled: true,
        backupCodes: backupCodes
      });

      res.json({ 
        message: "Email-based 2FA enabled successfully",
        backupCodes: backupCodes
      });
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      res.status(500).json({ message: "Failed to enable 2FA" });
    }
  });

  // Send 2FA code via email
  app.post("/api/2fa/send-code", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store the code temporarily (in production, use Redis or similar)
      await storage.createPasswordResetToken({
        email: email,
        token: code,
        expiresAt: expiresAt,
        used: false
      });

      // For development, return the code in response
      if (process.env.NODE_ENV === 'development') {
        return res.json({ 
          message: "2FA code sent",
          code: code // Only in development
        });
      }

      // In production, send email here
      res.json({ message: "2FA verification code sent to your email" });
    } catch (error) {
      console.error("Error sending 2FA code:", error);
      res.status(500).json({ message: "Failed to send 2FA code" });
    }
  });

  // 2FA Disable endpoint
  app.post("/api/2fa/disable", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { token, password } = req.body;

      // Verify password first
      const user = await storage.getUser(req.user.id);
      const passwordValid = await comparePasswords(password, user.password);
      
      if (!passwordValid) {
        return res.status(400).json({ message: "Invalid password" });
      }

      // Verify 2FA token if provided
      if (token && user.twoFactorSecret) {
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: token,
          window: 2
        });

        if (!verified) {
          return res.status(400).json({ message: "Invalid verification code" });
        }
      }

      // Disable 2FA
      await storage.updateUserTwoFactor(req.user.id, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null
      });

      res.json({ message: "2FA disabled successfully" });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  // Password reset request endpoint
  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ message: "If an account with that email exists, a reset code has been sent" });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await storage.createPasswordResetToken({
        email: email,
        token: resetToken,
        expiresAt: expiresAt,
        used: false
      });

      // Send password reset email
      await emailService.sendPasswordReset(email, resetToken);

      // For development, return the token in response
      if (process.env.NODE_ENV === 'development') {
        return res.json({ 
          message: "Reset code sent",
          resetCode: resetToken // Only in development
        });
      }

      // In production, send email here
      res.json({ message: "If an account with that email exists, a reset code has been sent" });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Password reset endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }

      // Find valid reset token
      const resetToken = await storage.getPasswordResetToken(code);
      if (!resetToken || resetToken.email !== email) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUser(user.id, { password: hashedPassword });

      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}