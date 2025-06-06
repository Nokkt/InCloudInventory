# Backend Development Guide

## File Structure

```
server/
├── index.js         # Main server entry point - Express app setup
├── auth.js          # Authentication logic - login/register/logout
├── routes.js        # API route definitions - all /api/* endpoints  
├── storage.js       # Database operations - CRUD for all entities
└── vite.ts          # Development server setup (don't modify)
```

## Key Files to Edit

### `storage.js` - Database Operations
**When to edit**: Adding new data operations, changing business logic

**Contains**:
- `MemStorage` class - In-memory storage for development
- `DatabaseStorage` class - PostgreSQL operations for production
- `IStorage` interface - Defines all available operations

**Common tasks**:
```javascript
// Add new method to IStorage interface
async createCustomer(customer) { ... }

// Implement in both MemStorage and DatabaseStorage
async createCustomer(customer) {
  // MemStorage: use Map operations
  // DatabaseStorage: use Drizzle ORM
}
```

### `routes.js` - API Endpoints
**When to edit**: Adding new API endpoints, changing request/response handling

**Structure**:
```javascript
// GET endpoints for data retrieval
app.get('/api/products', async (req, res) => { ... });

// POST endpoints for data creation
app.post('/api/products', async (req, res) => { ... });

// PUT/PATCH for updates, DELETE for removal
```

**Validation pattern**:
```javascript
// Always validate request body with Zod schemas
const validatedData = insertProductSchema.parse(req.body);
const result = await storage.createProduct(validatedData);
```

### `auth.js` - Authentication
**When to edit**: Changing auth logic, adding security features

**Key functions**:
- `hashPassword()` - Password encryption
- `comparePasswords()` - Password verification  
- `setupAuth()` - Passport configuration and auth routes

## Database Schema (`../shared/schema.ts`)

**Current Tables**:
- `users` - User accounts and profiles
- `products` - Food inventory items
- `categories` - Product categories (food-specific)
- `stockTransactions` - Inventory in/out movements
- `orders` - Purchase orders
- `orderItems` - Individual items in orders
- `customers` - Customer information

**Adding new tables**:
1. Define table in `schema.ts`
2. Create insert/select schemas with Zod
3. Add CRUD methods to storage interface
4. Create API routes

## Common Backend Tasks

### Adding a New Entity

1. **Schema** (`shared/schema.ts`):
```typescript
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  // ... other fields
});
```

2. **Storage** (`storage.js`):
```javascript
// Add to IStorage interface
async getAllSuppliers();
async createSupplier(supplier);

// Implement in both storage classes
```

3. **Routes** (`routes.js`):
```javascript
app.get('/api/suppliers', async (req, res) => {
  const suppliers = await storage.getAllSuppliers();
  res.json(suppliers);
});
```

### Modifying Existing Features

**Low Stock Threshold**: Change in `getLowStockItems()` method
**Expiration Window**: Modify `getExpiringProducts()` method  
**Default Currency**: Update in product creation logic
**Food Categories**: Modify `initializeData()` in MemStorage

### Error Handling Pattern

```javascript
app.post('/api/products', async (req, res) => {
  try {
    const validatedData = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(validatedData);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ error: error.message });
  }
});
```

## Database Operations

**Development**: Uses `MemStorage` with in-memory Maps
**Production**: Uses `DatabaseStorage` with PostgreSQL via Drizzle ORM

**Switching storage**: Automatic based on DATABASE_URL environment variable

## Testing Changes

1. Start development server: `npm run dev`
2. Test API endpoints with browser/curl
3. Check database changes with `npm run db:push`
4. Verify frontend integration works correctly

## Important Notes

- Always validate input with Zod schemas from `shared/schema.ts`
- Use the storage interface, never access database directly in routes
- Maintain compatibility between MemStorage and DatabaseStorage
- PHP is the default currency for the application
- Focus on food inventory features (expiration tracking, etc.)