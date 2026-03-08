# Ekama - Your Digital Twin

## Overview

Ekama is a spiritual e-commerce platform built with modern web technologies, featuring a microservices-ready architecture with React frontend, Express backend, and API Gateway.

## 🚀 Current Status

✅ **Frontend**: Running on http://localhost:8080  
✅ **Backend**: Running on http://localhost:3001  
✅ **Payment System**: Fully operational with Razorpay integration  
✅ **Database**: SQLite with full order management  

## 🛠️ Technology Stack

### Frontend
- **Vite** - Build tool and development server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Navigation
- **React Query** - Data fetching and caching

### Backend
- **Express.js** - API framework
- **TypeScript** - Type safety
- **SQLite** - Database
- **Razorpay** - Payment gateway integration

### Architecture
- **API Gateway** - Microservices entry point (port 3000)
- **Frontend** - React SPA (port 8080)
- **Backend** - Monolithic API (port 3001)

## 📁 Project Structure

```
ekama-your-digital-twin-main/
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.tsx          # Authentication hook
│   │   ├── use-cart.tsx          # Shopping cart hook
│   │   └── use-toast.ts          # Toast notifications hook
│   ├── pages/                    # Application pages
│   │   ├── Payment.tsx           # Payment processing page
│   │   ├── Orders.tsx            # Order history page
│   │   ├── Profile.tsx           # User profile page
│   │   └── Cart.tsx              # Shopping cart page
│   └── lib/                      # Utility libraries
├── backend/                      # Express backend API
│   ├── src/
│   │   ├── routes/               # API routes
│   │   │   ├── payments.ts       # Payment endpoints (fixed async/await)
│   │   │   ├── products.ts       # Product management
│   │   │   ├── collections.ts    # Product collections
│   │   │   └── users.ts          # User management
│   │   ├── utils/                # Backend utilities
│   │   │   └── database.ts       # SQLite database setup
│   │   └── server.ts             # Express server configuration
│   └── database.sqlite           # SQLite database file
└── services/
    └── api-gateway/              # API Gateway service
        └── src/
            └── server.ts           # Gateway configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or bun package manager

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend && npm install

# API Gateway dependencies
cd services/api-gateway && npm install
```

### 2. Start Development Servers

  Run The Frontend, Backend, and API Gateway Servers(IN THREE DIFFERENT TERMINALS)

```bash
# Terminal 1: Start Frontend (port 8080)
npm run dev

# Terminal 2: Start Backend (port 3001)
cd backend && npm run dev

# Terminal 3: Start API Gateway (port 3000)
cd services/api-gateway && npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **API Gateway**: http://localhost:3000
- **Backend Health Check**: http://localhost:3001/api/health

## 💳 Payment System

The payment system is fully integrated with Razorpay and includes:

- **Order Creation**: Creates orders with items in the database
- **Payment Processing**: Handles Razorpay payment flow
- **Order Status Updates**: Updates order status after payment completion
- **User Order History**: Retrieves user's order history

### Payment API Endpoints

- `POST /api/payments/create-order-with-items` - Create order with items
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/update-order-status` - Update order status
- `GET /api/payments/user-orders/:userId` - Get user orders

## 🔧 Recent Fixes

### TypeScript Async/Await Issues
- Fixed TS7030 errors in `backend/src/routes/payments.ts`
- Implemented proper Promise wrappers for SQLite callback methods
- Ensured all code paths return values in async functions

### Frontend Payment Component
- Fixed missing `useAuth` import in `src/pages/Payment.tsx`
- Payment flow now works end-to-end with user authentication

### Port Configuration
- Backend: Port 3001 (resolved conflicts)
- Frontend: Port 8080 (Vite dev server)
- API Gateway: Port 3000

## 🛍️ Features

- **Product Catalog**: Browse spiritual products with categories
- **Shopping Cart**: Add/remove items with quantity management
- **User Authentication**: Login/signup with JWT tokens
- **Payment Processing**: Secure payments via Razorpay
- **Order Management**: Track orders and payment status
- **Responsive Design**: Mobile-first responsive UI

## 🔐 Environment Variables

Create `.env` files in respective directories:

### Backend (.env)
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

## 🧪 Testing

### Backend API Testing
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test payment endpoints (examples)
curl -X POST http://localhost:3001/api/payments/create-order-with-items \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"test","name":"Test Product","price":99.99,"quantity":1}],"totalAmount":99.99,"userId":"test-user"}'
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production backend
cd backend && npm run build && npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 📈 Future Enhancements

### Microservices Architecture
- Split backend into domain services (auth, catalog, orders, payments)
- Implement event-driven architecture with message queue
- Add service discovery and load balancing

### Database
- Migrate from SQLite to PostgreSQL
- Implement database migrations
- Add Redis for caching and session management

### Monitoring
- Add logging with Winston/Pino
- Implement health checks for all services
- Add application monitoring (APM)

## 📝 License

This project is part of the Ekama digital transformation initiative.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section in the documentation
2. Review the GitHub issues
3. Contact the development team

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Status**: ✅ Fully Operational