# HOUSE OF SHUBHANSHI — WEAR THE DREAM
### Full-Stack Premium Indian Ethnic Fashion E-Commerce Platform

A production-grade, consolidated full-stack luxury Indian ethnic fashion e-commerce platform. Built with vanilla **HTML5**, **CSS3**, and **Vanilla JavaScript** on the frontend, and a high-performance **Node.js + Express + PostgreSQL (`pg`)** backend with secure JWT HTTP-only cookie authentication, transactional order processing, real-time inventory management, and live order lifecycle tracking.

---

## 1. Consolidated Architecture

```text
                    HOUSE OF SHUBHANSHI
                           │
                    ONE WEBSITE HOST
                 (http://localhost:3000)
                           │
              ┌────────────┴────────────┐
              │                         │
          FRONTEND                 BACKEND API
       (HTML/CSS/JS)            (Node.js + Express)
              │                         │
              └────────────┬────────────┘
                           │
                       DATABASE
                           │
                      PostgreSQL
```

- **ONE Host Origin:** `http://localhost:3000` serves all pages and API endpoints. No multiple ports or servers.
- **ONE Frontend:** All pages (`index.html`, `shop.html`, `cart.html`, `login.html`, `signup.html`, `orders.html`, `customer-dashboard.html`, `admin-dashboard.html`) share the same origin, design language, and central API configuration.
- **ONE Backend API:** Express server mounted on `/api/...` with strict security, authentication, and authorization.
- **ONE Database Source of Truth:** PostgreSQL with parameterized SQL queries, foreign key constraints, atomic transactions, and automated schema migration.
- **ONE Authentication System:** JSON Web Tokens (JWT) in secure HTTP-only cookies with role-based access control (`CUSTOMER` vs `ADMIN`).

---

## 2. Technology Stack

### Frontend
- **HTML5:** Accessible, semantic markup with luxury aesthetic styling
- **CSS3:** Custom properties design system, responsive layouts (360px up to 1920px), reduced-motion support
- **Vanilla JavaScript:** Zero frontend frameworks, central `api.js` configuration using relative `/api` paths, IntersectionObserver reveals, live cart management

### Backend
- **Node.js & Express.js:** RESTful API architecture, modular routers, controllers, services, and middlewares
- **Database Engine:** PostgreSQL via official `pg` driver (node-postgres) with parameterized SQL queries
- **Authentication:** Salted `bcryptjs` password hashing + JWT in HTTP-only cookies
- **Transactions:** Atomic order checkout with product stock validation and decrement

---

## 3. Project Directory Structure

```text
house-of-shubhanshi/
│
├── frontend/
│   ├── index.html                   # Master Landing Page (Hero video, Curations, Story, CTA)
│   ├── about.html                   # Atelier Heritage & Chronicle Page
│   ├── shop.html                    # Database-driven collection archive with filters & modal
│   ├── cart.html                    # Bespoke bag & authenticated checkout desk
│   ├── login.html                   # Luxury salon sign in with password toggle & remember-me
│   ├── signup.html                  # Atelier patron registration with strict criteria validation
│   ├── orders.html                  # Real-time order tracker (horizontal desktop, vertical mobile)
│   ├── customer-dashboard.html      # "Luxury Personal Closet" (Overview, Orders, Spending, Profile)
│   ├── admin-dashboard.html         # "Atelier Control Room" (Overview, Orders, Products, Sales)
│   │
│   ├── css/
│   │   ├── style.css                # Brand theme, variables, base typography, and layouts
│   │   ├── responsive.css           # Fluid layouts across mobile, tablet, and widescreen
│   │   ├── animations.css           # Subtle IntersectionObserver scroll reveals & page transitions
│   │   ├── auth.css                 # Premium auth card styling and error alert banners
│   │   └── dashboard.css            # Atelier control room & customer closet styling
│   │
│   ├── js/
│   │   ├── api.js                   # Central frontend API configuration (relative /api base)
│   │   ├── main.js                  # Sticky header, reveals, drawer, home quick view & bag sync
│   │   ├── auth.js                  # Authentication client, session checking, dynamic header
│   │   ├── shop.js                  # Dynamic product/collection fetcher and quick-view modal
│   │   ├── cart.js                  # Bespoke bag storage, checkout flow, and order generation
│   │   ├── orders.js                # Order timeline status visualizer synchronized with database
│   │   ├── customer-dashboard.js    # Customer closet, spending analytics, and profile updater
│   │   └── admin-dashboard.js       # Admin sales analytics, product CRUD, status controls
│   │
│   └── assets/
│       ├── logo/                    # Brand logos (PNG and SVG with gold gradients)
│       ├── video/                   # Luxury Indian handloom & ethnic fashion hero videos
│       ├── images/                  # Garment photography, karigari portraits & couture sketches
│       └── icons/                   # Brand and UI iconography
│
├── backend/
│   ├── src/
│   │   ├── server.js                # Express app, CORS, static frontend hosting, route mounting
│   │   ├── config/
│   │   │   ├── env.js               # Typed environment variable loader with safe defaults
│   │   │   ├── database.js          # PostgreSQL client, pool, transactions, and migration runner
│   │   │   ├── schema.sql           # PostgreSQL production DDL (tables, constraints, indexes)
│   │   │   ├── initDb.js            # CLI database initializer & seeder
│   │   │   └── db.js                # Parameterized SQL data access repositories
│   │   ├── middleware/
│   │   │   ├── auth.js              # requireAuth, requireAdmin, optionalAuth middlewares
│   │   │   └── errorHandler.js      # Global JSON error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js       # /api/auth routes
│   │   │   ├── product.routes.js    # /api/products routes
│   │   │   ├── collection.routes.js # /api/collections routes
│   │   │   ├── order.routes.js      # /api/orders routes (Customer protected)
│   │   │   ├── customer.routes.js   # /api/customer/dashboard routes (Customer protected)
│   │   │   └── admin.routes.js      # /api/admin routes (Admin protected)
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── collection.controller.js
│   │   │   ├── order.controller.js
│   │   │   └── admin.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── product.service.js
│   │   │   ├── collection.service.js
│   │   │   ├── order.service.js
│   │   │   └── analytics.service.js
│   │   └── utils/
│   │       ├── response.js          # Standardized JSON response utilities
│   │       └── validator.js         # Input sanitization and validation helpers
│   ├── .env                         # Backend environment variables
│   └── package.json                 # Backend package manifest
│
├── .env                             # Root environment variables
├── .env.example                     # Environment template
├── .gitignore                       # Ignored directories (.env, node_modules, data)
├── package.json                     # Root consolidated package manifest
└── README.md                        # Documentation
```

---

## 4. Quick Start: One Command Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```ini
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/house_of_shubhanshi?schema=public"
JWT_SECRET="house_of_shubhanshi_super_secret_jwt_key_2026_dev"
COOKIE_EXPIRES_IN_MS=604800000

# Default Seed Administrator
ADMIN_NAME="House of Shubhanshi Atelier"
ADMIN_EMAIL="admin@houseofshubhanshi.com"
ADMIN_PASSWORD="Admin@Shubhanshi2026!"
ADMIN_PHONE="+91 9560011351"
```

### Step 3: Run the Website
```bash
npm run dev
```

Open your browser at:
**[http://localhost:3000](http://localhost:3000)**

---

## 5. Website Pages & URL Sitemap (All Port 3000)

| Page | URL | Description | Access |
|------|-----|-------------|--------|
| **Home** | `http://localhost:3000/` | Master landing page with hero video, curations & story | Public |
| **About** | `http://localhost:3000/about.html` | Atelier chronicle and heritage story | Public |
| **Shop** | `http://localhost:3000/shop.html` | Collection vault with filters and quick view | Public |
| **Cart** | `http://localhost:3000/cart.html` | Bespoke bag & order checkout desk | Public / Auth |
| **Login** | `http://localhost:3000/login.html` | Patron sign in | Public |
| **Signup** | `http://localhost:3000/signup.html` | Patron registration (enforces `CUSTOMER` role) | Public |
| **Order Status** | `http://localhost:3000/orders.html` | Real-time order tracker timeline | Authenticated |
| **Customer Closet** | `http://localhost:3000/customer-dashboard.html` | Patron spending, order history & profile | Authenticated |
| **Admin Control Room** | `http://localhost:3000/admin-dashboard.html` | Sales analytics, product CRUD & order management | Admin Only |
| **Health Check** | `http://localhost:3000/api/health` | PostgreSQL connectivity verification | Public |

---

## 6. Default Credentials

### Master Administrator
- **Email:** `admin@houseofshubhanshi.com`
- **Password:** `Admin@Shubhanshi2026!`
- **Role:** `ADMIN`
- **Dashboard:** [http://localhost:3000/admin-dashboard.html](http://localhost:3000/admin-dashboard.html)

### Sample Customers
- **Email:** `yash@example.com`
- **Password:** `Customer@2026`
- **Role:** `CUSTOMER`
- **Dashboard:** [http://localhost:3000/customer-dashboard.html](http://localhost:3000/customer-dashboard.html)

---

## 7. API Reference

All requests route through relative `/api`:

### Authentication (`/api/auth`)
- `POST /api/auth/signup` — Create patron account
- `POST /api/auth/login` — Sign in and receive HTTP-only cookie
- `POST /api/auth/logout` — Clear session cookie
- `GET /api/auth/me` — Return current session user
- `PUT /api/auth/profile` — Update patron profile

### Catalog (`/api/products` & `/api/collections`)
- `GET /api/products` — Retrieve all active products
- `GET /api/products/:id` — Product details by ID or slug
- `POST /api/products` — Add product (Admin only)
- `PUT /api/products/:id` — Update product (Admin only)
- `DELETE /api/products/:id` — Delete product (Admin only)
- `GET /api/collections` — Retrieve all active collections
- `GET /api/collections/:id` — Collection details

### Orders & Checkout (`/api/orders`)
- `POST /api/orders` — Transactional checkout (stock decrement, price verification)
- `GET /api/orders` — Customer order list
- `GET /api/orders/:id` — Order status timeline (verified ownership)
- `GET /api/orders/analytics` — Customer spending breakdown

### Customer Dashboard (`/api/customer`)
- `GET /api/customer/dashboard` — Live customer analytics & metrics
- `GET /api/customer/orders` — Customer orders

### Admin Management (`/api/admin`)
- `GET /api/admin/overview` (or `/api/admin/dashboard`) — Atelier sales & catalog metrics
- `GET /api/admin/sales` — Time-filtered revenue analytics (today, 7d, 30d, year, all)
- `GET /api/admin/orders` — All atelier orders
- `PATCH /api/admin/orders/:id/status` — Update order status (`RECEIVED` → `DISPATCHED` → `OUT_FOR_DELIVERY` → `DELIVERED`)
- `PATCH /api/admin/orders/:id/payment` — Update payment status (`PENDING` → `PAID`)
- `GET /api/admin/customers` — Patrons list with order count & total spent
- `GET /api/admin/products` — Admin products view
- `GET /api/admin/collections` — Admin collections view
