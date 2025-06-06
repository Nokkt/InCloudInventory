import { users, products, categories, inventoryBatches, stockTransactions, orders, orderItems, customers } from "../shared/schema.js";
import { eq, lte, and, or } from 'drizzle-orm';
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/node-postgres";
import connectPg from "connect-pg-simple";
import pg from "pg";

const PostgresSessionStore = connectPg(session);
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool);
const MemoryStore = createMemoryStore(session);

class MemStorage {
  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.inventoryBatches = new Map();
    this.stockTransactions = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.customers = new Map();
    this.passwordResetTokens = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentCategoryId = 1;
    this.currentBatchId = 1;
    this.currentTransactionId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentCustomerId = 1;
    this.currentTokenId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    this.initializeData();
  }

  initializeData() {
    // Initialize food categories
    const foodCategories = [
      { id: 1, name: "Fruits", description: "Fresh fruits and produce" },
      { id: 2, name: "Vegetables", description: "Fresh vegetables and greens" },
      { id: 3, name: "Dairy", description: "Milk, cheese, yogurt, and dairy products" },
      { id: 4, name: "Meat & Poultry", description: "Fresh meat, chicken, and poultry" },
      { id: 5, name: "Seafood", description: "Fish and seafood products" },
      { id: 6, name: "Grains & Rice", description: "Rice, grains, and cereals" },
      { id: 7, name: "Bread", description: "Bread and bakery products" },
      { id: 8, name: "Dry Goods", description: "Pasta, beans, and dry ingredients" },
      { id: 9, name: "Frozen Goods", description: "Frozen foods and products" },
      { id: 10, name: "Beverages", description: "Drinks and beverages" }
    ];

    foodCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
    this.currentCategoryId = 11;

    // Initialize sample products
    const sampleProducts = [
      {
        id: 1,
        name: "Rice (5kg)",
        sku: "RIC-5KG-001",
        description: "Premium quality white rice",
        categoryId: 6,
        price: 25.99,
        costPrice: 18.50,
        minStockLevel: 20,
        currentStock: 150,
        isFoodProduct: true,
        shelfLife: 365,
        imageUrl: null,
        createdAt: new Date()
      },
      {
        id: 2,
        name: "Fresh Milk (1L)",
        sku: "MLK-1L-001",
        description: "Fresh whole milk",
        categoryId: 3,
        price: 3.99,
        costPrice: 2.80,
        minStockLevel: 50,
        currentStock: 75,
        isFoodProduct: true,
        shelfLife: 7,
        imageUrl: null,
        createdAt: new Date()
      }
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });
    this.currentProductId = 3;

    // Create initial inventory batches for sample products with existing stock
    this.createInitialBatches();
  }

  // Create initial inventory batches for sample products
  createInitialBatches() {
    const initialBatches = [
      {
        id: 1,
        productId: 1, // Rice
        batchNumber: "INIT-001",
        quantity: 150,
        remainingQuantity: 150,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdAt: new Date(),
        userId: 1
      },
      {
        id: 2,
        productId: 2, // Milk
        batchNumber: "INIT-002", 
        quantity: 75,
        remainingQuantity: 75,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        userId: 1
      }
    ];

    initialBatches.forEach(batch => {
      this.inventoryBatches.set(batch.id, batch);
    });
    this.currentBatchId = 3;
  }

  // User methods
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { 
      ...insertUser, 
      id,
      role: insertUser.role || "User",
      profileImageUrl: insertUser.profileImageUrl || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id, userUpdate) {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers() {
    return Array.from(this.users.values());
  }

  async deleteUser(id) {
    return this.users.delete(id);
  }

  // Product methods
  async getAllProducts() {
    const products = Array.from(this.products.values());
    console.log('getAllProducts() returning:', products.map(p => ({ id: p.id, name: p.name, currentStock: p.currentStock })));
    
    // Additional verification - check if any products have inconsistent stock vs batches
    for (const product of products) {
      const batches = await this.getInventoryBatchesByProduct(product.id);
      const batchTotal = batches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
      if (product.currentStock !== batchTotal) {
        console.log(`INCONSISTENCY DETECTED: Product ${product.id} currentStock=${product.currentStock} but batch total=${batchTotal}`);
      }
    }
    
    return products;
  }

  async getProduct(id) {
    return this.products.get(id);
  }

  async createProduct(product) {
    const id = this.currentProductId++;
    const now = new Date();
    const newProduct = { 
      ...product, 
      id, 
      createdAt: now,
      description: product.description || null,
      minStockLevel: product.minStockLevel || 10,
      imageUrl: product.imageUrl || null,
      currentStock: product.currentStock || 0,
      isFoodProduct: product.isFoodProduct || true,
      shelfLife: product.shelfLife || null
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id, productUpdate) {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updatedProduct = { ...product, ...productUpdate };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id) {
    return this.products.delete(id);
  }

  // Category methods
  async getAllCategories() {
    return Array.from(this.categories.values());
  }

  async createCategory(category) {
    const id = this.currentCategoryId++;
    const newCategory = { 
      ...category, 
      id,
      description: category.description || null
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Stock transaction methods
  async getAllStockTransactions() {
    return Array.from(this.stockTransactions.values());
  }

  async getStockTransaction(id) {
    return this.stockTransactions.get(id);
  }

    
  async updateStockTransaction(id, update) {
    const transaction = this.stockTransactions.get(id);
    if (!transaction) return undefined;
    const updatedTransaction = { ...transaction, ...update };
    this.stockTransactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteStockTransaction(id) {
    return this.stockTransactions.delete(id);
  }

  // Order methods
  async getAllOrders() {
    return Array.from(this.orders.values());
  }

  async createOrderItem(item) {
    const id = this.currentOrderItemId++;
    const newOrderItem = { ...item, id };
    this.orderItems.set(id, newOrderItem);
    return newOrderItem;
  }

  async createOrder(order, items) {
    const id = this.currentOrderId++;
    const now = new Date();
    const newOrder = { 
      ...order, 
      id, 
      orderDate: now,
      status: order.status || "pending",
      customerId: order.customerId || null,
      notes: order.notes || null
    };
    
    // Create order items
    const orderItems = [];
    for (const item of items) {
      const orderItemId = this.currentOrderItemId++;
      const newOrderItem = { ...item, id: orderItemId, orderId: id };
      this.orderItems.set(orderItemId, newOrderItem);
      orderItems.push(newOrderItem);
    }
    
    newOrder.orderItems = orderItems;
    this.orders.set(id, newOrder);
    return newOrder;
  }

  // Dashboard methods
  async getTotalProducts() {
    return this.products.size;
  }

  async getLowStockItems() {
    return Array.from(this.products.values()).filter(product => 
      product.currentStock <= 50
    );
  }

  async getExpiringProducts() {
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    
    return Array.from(this.products.values())
      .filter(product => {
        if (!product.shelfLife) return false;
        const expiryDate = new Date(product.createdAt);
        expiryDate.setDate(expiryDate.getDate() + product.shelfLife);
        return expiryDate <= oneMonthFromNow;
      })
      .map(product => {
        const expiryDate = new Date(product.createdAt);
        expiryDate.setDate(expiryDate.getDate() + product.shelfLife);
        return { ...product, expiryDate };
      });
  }

  async getTotalOrders() {
    return this.orders.size;
  }

  async getRecentActivity() {
    const transactions = Array.from(this.stockTransactions.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    return transactions.map(transaction => {
      const product = this.products.get(transaction.productId);
      return {
        id: transaction.id,
        type: transaction.type === 'in' ? 'Stock In' : 'Stock Out',
        productName: product ? product.name : `Product #${transaction.productId}`,
        quantity: transaction.quantity,
        timestamp: transaction.timestamp,
        reason: transaction.reason
      };
    });
  }

  // Batch inventory management methods
  async getAllInventoryBatches() {
    return Array.from(this.inventoryBatches.values());
  }

  async getInventoryBatchesByProduct(productId) {
    return Array.from(this.inventoryBatches.values())
      .filter(batch => batch.productId === productId)
      .sort((a, b) => {
        // Sort by expiry date (earliest first) for FIFO
        if (!a.expiryDate && !b.expiryDate) return new Date(a.createdAt) - new Date(b.createdAt);
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      });
  }

  async createInventoryBatch(batch) {
    const id = this.currentBatchId++;
    const now = new Date();
    const newBatch = { 
      ...batch, 
      id, 
      createdAt: now,
      remainingQuantity: batch.quantity
    };
    this.inventoryBatches.set(id, newBatch);
    return newBatch;
  }

  async updateInventoryBatch(id, batchUpdate) {
    const existingBatch = this.inventoryBatches.get(id);
    if (!existingBatch) return undefined;
    
    const updatedBatch = { ...existingBatch, ...batchUpdate };
    this.inventoryBatches.set(id, updatedBatch);
    return updatedBatch;
  }

  // Enhanced stock transaction with batch tracking
  async createStockTransaction(transaction) {
    const id = this.currentTransactionId++;
    const now = new Date();
    
    if (transaction.type === 'in') {
      // For stock-in, create a new batch
      const product = this.products.get(transaction.productId);
      if (!product) throw new Error('Product not found');
      
      let expiryDate = null;
      if (product.isFoodProduct && product.shelfLife) {
        expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + product.shelfLife);
      }
      if (transaction.expiryDate) {
        expiryDate = new Date(transaction.expiryDate);
      }
      
      // Generate batch number if not provided
      const batchNumber = transaction.batchNumber || `B${id}-${Date.now()}`;
      
      // Create inventory batch
      const batch = await this.createInventoryBatch({
        productId: transaction.productId,
        batchNumber,
        quantity: transaction.quantity,
        expiryDate,
        userId: transaction.userId
      });
      
      // Update product stock based on actual batch quantities
      const allBatches = await this.getInventoryBatchesByProduct(transaction.productId);
      const totalBatchStock = allBatches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
      console.log(`BEFORE UPDATE - Product ${transaction.productId} currentStock: ${product.currentStock}`);
      console.log(`- All batches:`, allBatches.map(b => ({ id: b.id, remaining: b.remainingQuantity })));
      console.log(`- Total batch stock calculated: ${totalBatchStock}`);
      
      product.currentStock = totalBatchStock;
      this.products.set(transaction.productId, product);
      
      // Verify the update
      const verifyProduct = this.products.get(transaction.productId);
      console.log(`AFTER UPDATE - Product ${transaction.productId} currentStock: ${verifyProduct.currentStock}`);
      console.log(`STOCK UPDATE TRACE: Setting product ${transaction.productId} stock to ${totalBatchStock} in createStockTransaction`);
      
      // Create transaction record
      const newTransaction = { 
        ...transaction, 
        id, 
        timestamp: now,
        batchId: batch.id,
        batchNumber,
        expiryDate
      };
      this.stockTransactions.set(id, newTransaction);
      return newTransaction;
      
    } else if (transaction.type === 'out') {
      // For stock-out, use FIFO from existing batches or target specific batch
      const product = this.products.get(transaction.productId);
      if (!product) throw new Error('Product not found');
      
      const availableBatches = await this.getInventoryBatchesByProduct(transaction.productId);
      const activeBatches = availableBatches.filter(batch => batch.remainingQuantity > 0);
      
      if (activeBatches.length === 0) {
        throw new Error('No stock available for this product');
      }
      
      let remainingQuantityToDeduct = transaction.quantity;
      const transactionsCreated = [];
      
      // If specific batch ID is provided, target that batch only
      if (transaction.batchId) {
        const targetBatch = activeBatches.find(batch => batch.id === transaction.batchId);
        if (!targetBatch) {
          throw new Error('Specified batch not found or has no remaining stock');
        }
        
        if (remainingQuantityToDeduct > targetBatch.remainingQuantity) {
          throw new Error(`Insufficient stock in batch. Available: ${targetBatch.remainingQuantity}, Requested: ${remainingQuantityToDeduct}`);
        }
        
        // Update batch remaining quantity
        targetBatch.remainingQuantity -= remainingQuantityToDeduct;
        await this.updateInventoryBatch(targetBatch.id, { remainingQuantity: targetBatch.remainingQuantity });
        
        // Create transaction record for this specific batch
        const transactionId = this.currentTransactionId++;
        const newTransaction = { 
          ...transaction, 
          id: transactionId, 
          timestamp: now,
          quantity: remainingQuantityToDeduct,
          batchId: targetBatch.id,
          batchNumber: targetBatch.batchNumber,
          expiryDate: targetBatch.expiryDate
        };
        this.stockTransactions.set(transactionId, newTransaction);
        transactionsCreated.push(newTransaction);
        
        // Update product stock based on actual batch quantities
        const updatedBatches = await this.getInventoryBatchesByProduct(transaction.productId);
        const totalBatchStock = updatedBatches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
        product.currentStock = totalBatchStock;
        this.products.set(transaction.productId, product);
        
        return newTransaction;
      }
      
      // Otherwise, use FIFO from existing batches
      const totalAvailable = activeBatches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
      
      if (remainingQuantityToDeduct > totalAvailable) {
        throw new Error(`Insufficient stock. Available: ${totalAvailable}, Requested: ${remainingQuantityToDeduct}`);
      }
      
      // Deduct from batches using FIFO (earliest expiry first)
      for (const batch of activeBatches) {
        if (remainingQuantityToDeduct <= 0) break;
        
        const quantityFromThisBatch = Math.min(remainingQuantityToDeduct, batch.remainingQuantity);
        
        // Update batch remaining quantity
        batch.remainingQuantity -= quantityFromThisBatch;
        await this.updateInventoryBatch(batch.id, { remainingQuantity: batch.remainingQuantity });
        
        // Create transaction record for this batch
        const transactionId = this.currentTransactionId++;
        const newTransaction = { 
          ...transaction, 
          id: transactionId, 
          timestamp: now,
          quantity: quantityFromThisBatch,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate
        };
        this.stockTransactions.set(transactionId, newTransaction);
        transactionsCreated.push(newTransaction);
        
        remainingQuantityToDeduct -= quantityFromThisBatch;
      }
      
      // Update product stock based on actual batch quantities
      const updatedBatches = await this.getInventoryBatchesByProduct(transaction.productId);
      const totalBatchStock = updatedBatches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
      product.currentStock = totalBatchStock;
      this.products.set(transaction.productId, product);
      
      // Return the primary transaction (first one created)
      return transactionsCreated[0];
    }
    
    // For other transaction types, create normally
    const newTransaction = { ...transaction, id, timestamp: now };
    this.stockTransactions.set(id, newTransaction);
    return newTransaction;
  }

  // Get expiring batches
  async getExpiringBatches(daysAhead = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    return Array.from(this.inventoryBatches.values())
      .filter(batch => 
        batch.remainingQuantity > 0 && 
        batch.expiryDate && 
        new Date(batch.expiryDate) <= cutoffDate
      )
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      .map(batch => {
        const product = this.products.get(batch.productId);
        return {
          ...batch,
          productName: product ? product.name : `Product #${batch.productId}`,
          daysUntilExpiry: Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
        };
      });
  }

  // Password reset token methods
  async createPasswordResetToken(tokenData) {
    const id = this.currentTokenId++;
    const token = { ...tokenData, id, createdAt: new Date() };
    this.passwordResetTokens.set(id, token);
    return token;
  }

  async getPasswordResetToken(token) {
    return Array.from(this.passwordResetTokens.values())
      .find(t => t.token === token && !t.used && new Date(t.expiresAt) > new Date());
  }

  async markTokenAsUsed(tokenId) {
    const token = this.passwordResetTokens.get(tokenId);
    if (token) {
      token.used = true;
      this.passwordResetTokens.set(tokenId, token);
      return token;
    }
    return null;
  }

  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  // 2FA methods
  async updateUserTwoFactor(userId, twoFactorData) {
    const user = this.users.get(userId);
    if (user) {
      Object.assign(user, twoFactorData);
      this.users.set(userId, user);
      return user;
    }
    return null;
  }
}

class DatabaseStorage {
  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  async getUser(id) {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username) {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(insertUser) {
    try {
      const result = await db.insert(users).values({
        ...insertUser,
        role: insertUser.role || "User",
        profileImageUrl: insertUser.profileImageUrl || null
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id, userUpdate) {
    try {
      const result = await db.update(users).set(userUpdate).where(eq(users.id, id)).returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async getAllUsers() {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async deleteUser(id) {
    try {
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async getAllProducts() {
    try {
      return await db.select().from(products);
    } catch (error) {
      console.error("Error getting all products:", error);
      return [];
    }
  }

  async getProduct(id) {
    try {
      const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting product:", error);
      return undefined;
    }
  }

  async createProduct(product) {
    try {
      const result = await db.insert(products).values(product).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  async updateProduct(id, productUpdate) {
    try {
      const result = await db.update(products).set(productUpdate).where(eq(products.id, id)).returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error updating product:", error);
      return undefined;
    }
  }

  async deleteProduct(id) {
    try {
      const result = await db.delete(products).where(eq(products.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  }

  async getAllCategories() {
    try {
      return await db.select().from(categories);
    } catch (error) {
      console.error("Error getting all categories:", error);
      return [];
    }
  }

  async createCategory(category) {
    try {
      const result = await db.insert(categories).values(category).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async getAllStockTransactions() {
    try {
      return await db.select().from(stockTransactions);
    } catch (error) {
      console.error("Error getting all stock transactions:", error);
      return [];
    }
  }

  async getStockTransaction(id) {
    try {
      const result = await db.select().from(stockTransactions).where(eq(stockTransactions.id, id)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error getting stock transaction:", error);
      return undefined;
    }
  }

  async createStockTransaction(transaction) {
    try {
      const result = await db.insert(stockTransactions).values(transaction).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating stock transaction:", error);
      throw error;
    }
  }

  async updateStockTransaction(id, update) {
    try {
      const result = await db.update(stockTransactions).set(update).where(eq(stockTransactions.id, id)).returning();
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error updating stock transaction:", error);
      return undefined;
    }
  }

  async deleteStockTransaction(id) {
    try {
      const result = await db.delete(stockTransactions).where(eq(stockTransactions.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting stock transaction:", error);
      return false;
    }
  }

  async getAllOrders() {
    try {
      const allOrders = await db.select().from(orders);
      
      for (const order of allOrders) {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        order.orderItems = items;
      }
      
      return allOrders;
    } catch (error) {
      console.error("Error getting all orders:", error);
      return [];
    }
  }

  async createOrderItem(item) {
    try {
      const result = await db.insert(orderItems).values(item).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating order item:", error);
      throw error;
    }
  }

  async createOrder(order, items) {
    try {
      const result = await db.insert(orders).values(order).returning();
      const newOrder = result[0];
      
      const orderItemsData = items.map(item => ({ ...item, orderId: newOrder.id }));
      const createdItems = await db.insert(orderItems).values(orderItemsData).returning();
      
      newOrder.orderItems = createdItems;
      return newOrder;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async getTotalProducts() {
    try {
      const result = await db.select().from(products);
      return result.length;
    } catch (error) {
      console.error("Error getting total products:", error);
      return 0;
    }
  }

  async getLowStockItems() {
    try {
      return await db.select().from(products).where(lte(products.currentStock, 50));
    } catch (error) {
      console.error("Error getting low stock items:", error);
      return [];
    }
  }

  async getExpiringProducts() {
    try {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      const allProducts = await db.select().from(products);
      
      return allProducts
        .filter(product => {
          if (!product.shelfLife) return false;
          const expiryDate = new Date(product.createdAt);
          expiryDate.setDate(expiryDate.getDate() + product.shelfLife);
          return expiryDate <= oneMonthFromNow;
        })
        .map(product => {
          const expiryDate = new Date(product.createdAt);
          expiryDate.setDate(expiryDate.getDate() + product.shelfLife);
          return { ...product, expiryDate };
        });
    } catch (error) {
      console.error("Error getting expiring products:", error);
      return [];
    }
  }

  async getTotalOrders() {
    try {
      const result = await db.select().from(orders);
      return result.length;
    } catch (error) {
      console.error("Error getting total orders:", error);
      return 0;
    }
  }

  async getRecentActivity() {
    try {
      const transactions = await db.select().from(stockTransactions).limit(5);
      const allProducts = await db.select().from(products);
      
      return transactions.map(transaction => {
        const product = allProducts.find(p => p.id === transaction.productId);
        return {
          id: transaction.id,
          type: transaction.type === 'in' ? 'Stock In' : 'Stock Out',
          productName: product ? product.name : `Product #${transaction.productId}`,
          quantity: transaction.quantity,
          timestamp: transaction.timestamp,
          reason: transaction.reason
        };
      });
    } catch (error) {
      console.error("Error getting recent activity:", error);
      return [];
    }
  }
}

let storage;

// Use in-memory storage for development to avoid database connection issues
console.log("Using in-memory storage");
storage = new MemStorage();

export { storage };
