# Node.js Express E-Commerce API (MongoDB)

Complete e-commerce backend built on Express Generator + MongoDB (Mongoose).

## Implemented Features

- Authentication: register, login, JWT auth, bcrypt hashing, forgot password, reset password, email verification, RBAC (admin/customer)
- Product management: CRUD, image upload (Multer), stock, reviews, rating updates, search/filter/pagination
- Cart system: add, remove, update quantity, view cart totals
- Order management: place order, my orders, details, status update, cancel order, admin order management
- Payments: Stripe intent support, Razorpay order support, COD support, payment status tracking
- Admin APIs: dashboard analytics, user management, category management, product management, order management

## Tech Stack

- Node.js
- Express.js (Express Generator)
- MongoDB + Mongoose
- JWT + bcryptjs
- Multer
- Stripe
- Razorpay
- Nodemailer

## Project Structure (Implemented)

- `app.js`
- `bin/www`
- `routes/` -> `auth.js`, `product.js`, `cart.js`, `order.js`, `user.js`, `category.js`, `admin.js`, `api.js`
- `src/config/`
- `src/controllers/`
- `src/models/`
- `src/middlewares/`
- `src/services/`
- `src/utils/`
- `public/uploads`

## Environment Variables

Copy `.env.example` to `.env` and fill values:

- PORT=4000
- MONGODB_URI=mongodb://127.0.0.1:27017/shopco
- MONGODB_URI_LIVE=your_live_connection
- USE_LIVE_DB=false
- JWT_SECRET=replace-with-a-secure-random-string
- JWT_EXPIRES_IN=7d
- EMAIL_USER=your_email@gmail.com
- EMAIL_PASS=your_email_app_password
- STRIPE_SECRET_KEY=your_stripe_secret_key
- RAZORPAY_KEY_ID=your_razorpay_key_id
- RAZORPAY_KEY_SECRET=your_razorpay_key_secret
- BUNNY_STORAGE_ZONE=your_bunny_storage_zone
- BUNNY_API_KEY=your_bunny_storage_api_key
- BUNNY_PULL_ZONE_BASE_URL=https://your-pull-zone.b-cdn.net
- BUNNY_STORAGE_HOST=storage.bunnycdn.com
- BUNNY_PATH_PREFIX=products

## Run

1. Install dependencies:
   - `npm install`
2. Start MongoDB local service
3. Start API:
   - `npm run dev`

Default server: `http://localhost:4000`

## Auth Endpoints

- `POST /api/auth/register`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

## Product Endpoints

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
- `POST /api/products/:id/reviews` (auth)
- `POST /api/products/upload` (admin)

## Cart Endpoints

- `GET /api/cart`
- `POST /api/cart/add`
- `PUT /api/cart/update`
- `DELETE /api/cart/remove`

## Order Endpoints

- `POST /api/orders`
- `GET /api/orders/my`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status` (admin)
- `PUT /api/orders/:id/payment-status` (admin)
- `PUT /api/orders/:id/cancel`

## User Endpoints

- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/users/orders`
- `GET /api/users` (admin)
- `PUT /api/users/:id/role` (admin)
- `DELETE /api/users/:id` (admin)

## Category Endpoints

- `GET /api/categories`
- `POST /api/categories` (admin)
- `PUT /api/categories/:id` (admin)
- `DELETE /api/categories/:id` (admin)

## Admin Endpoints

- `GET /api/admin/dashboard`
- `GET /api/admin/orders`

## Seeded Admin Account

- Email: `admin@shop.co`
- Password: `Admin@123`

Change this in production.

## Notes

- If SMTP or payment keys are not configured, email/payment services use safe fallback or mock mode for development.
