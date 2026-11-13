# Smart Inventory Pro

React + Vite frontend, Node.js + Express API, MongoDB database.

## Features
- Product CRUD, search, category and barcode fields
- Business-scoped inventory (maximum 100,000 products per business)
- JWT login with admin/staff roles
- Sales recording and sales history
- Low-stock alerts based on each product's reorder level
- Moving-average restocking suggestions from the last 30 days of sales
- Dashboard charts
- Barcode scanning using a device camera (HTTPS or localhost required)
- PWA app-shell caching and offline product view; offline product changes are queued in the browser and synced when online

## Requirements
- Node.js LTS
- MongoDB Community Server
- MongoDB Compass (optional GUI)

## Setup

### 1. Backend
Open a terminal:
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```
Edit `backend/.env` if your MongoDB URI differs.

### 2. Create the first admin
In another terminal:
```powershell
cd backend
npm run seed:admin
```
Default demo credentials:
- Email: `admin@example.com`
- Password: `Admin@12345`

Change the password after first login. The seed command creates a demo business and admin only if they do not already exist.

### 3. Frontend
In a third terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal, normally http://localhost:5173.
You can also use VS Code Command Palette > Simple Browser: Show to view it inside VS Code.

## Roles
- Admin: all inventory operations, user creation, sales, analytics.
- Staff: view inventory, record sales, view alerts and analytics. Staff cannot delete products or manage users.

## API summary
- POST `/api/auth/login`
- POST `/api/auth/users` (admin only)
- GET/POST `/api/products`
- GET/PUT/DELETE `/api/products/:id`
- POST `/api/sales`
- GET `/api/sales/history`
- GET `/api/alerts/low-stock`
- GET `/api/analytics/summary`
- GET `/api/restock/suggestions`

All authenticated requests use `Authorization: Bearer <token>`.

## Important production notes
This is an educational, local development starter. It demonstrates the requested features but is not certified for 1 million transactions/day. That capacity requires production deployment, horizontal API scaling, MongoDB replica set/sharding where appropriate, queue-based processing, monitoring, backups, security review, and load testing with realistic data. The 100,000-product limit is enforced per business in the API; database indexes and pagination are included.

Offline support caches the app shell and the last product list, and queues product create/update/delete operations in IndexedDB until the browser reconnects. Authentication and server-only analytics require connectivity. Barcode camera access generally requires HTTPS or localhost.
