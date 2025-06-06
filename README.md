# InCloud - Food Inventory Management System

A comprehensive web-based inventory management system specifically designed for food product tracking, expiration monitoring, and stock management.

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks (auth, etc.)
│   │   ├── lib/            # Utilities and helper functions
│   │   └── pages/          # Application pages/routes
│   └── index.html          # HTML entry point
├── server/                 # Backend Node.js/Express server
│   ├── auth.js             # Authentication logic and passport setup
│   ├── index.js            # Main server entry point
│   ├── routes.js           # API route definitions
│   ├── storage.js          # Database operations and storage interface
│   └── vite.ts             # Vite development server setup
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions (Drizzle ORM)
├── uploads/                # File upload storage
└── package.json            # Dependencies and scripts
```

## Backend Development Guide

### Key Files for Backend Modifications

#### 1. `server/storage.js` - Database Operations
- Contains all CRUD operations for users, products, categories, orders, etc.
- Two implementations: `MemStorage` (in-memory) and `DatabaseStorage` (PostgreSQL)
- Modify this file when adding new database operations or changing data models

#### 2. `server/routes.js` - API Routes
- Defines all REST API endpoints (`/api/*`)
- Add new routes here for additional functionality
- All routes use the storage interface for data operations

#### 3. `server/auth.js` - Authentication
- Handles user registration, login, logout
- Password hashing and session management
- Modify for authentication changes or security updates

#### 4. `shared/schema.ts` - Database Schema
- Drizzle ORM schema definitions
- Add new tables or modify existing ones here
- Includes Zod validation schemas for API requests

### Current Features

- **User Management**: Registration, login, profile management
- **Product Management**: CRUD operations for food products
- **Category Management**: Food-specific categories (fruits, vegetables, dairy, etc.)
- **Stock Tracking**: Inventory in/out transactions with expiration dates
- **Order Management**: Purchase orders and order items
- **Dashboard Analytics**: Low stock alerts, expiration reports

### Food-Specific Features

- Products limited to 50 or fewer items trigger low stock alerts
- Expiration monitoring for products within 1 month
- PHP currency as default
- Food categories: Fruits, Vegetables, Dairy, Meat & Poultry, Seafood, Grains & Rice, Bread, Dry Goods, Frozen Goods, Beverages

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema changes to database
```

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Environment (development/production)

### Adding New Features

1. **Database Changes**: Update `shared/schema.ts` with new tables/fields
2. **Storage Operations**: Add methods to `IStorage` interface and both storage implementations in `server/storage.js`
3. **API Routes**: Create new endpoints in `server/routes.js`
4. **Frontend Integration**: Update client-side code to consume new APIs

### Database Migration

Use `npm run db:push` to apply schema changes. The system uses Drizzle ORM for database operations and migrations.