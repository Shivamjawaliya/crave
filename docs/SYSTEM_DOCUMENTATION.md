# Food Delivery & Restaurant Management Platform — System Documentation

This document provides a comprehensive overview of the architecture, folder structure, libraries, database design, domain modules, frontend applications, security mechanisms, and development workflows established for this repository.

---

## 1. Executive Summary & Tech Stack

This project is a production-grade, modular monorepo for a **Food Delivery and Restaurant Management Platform**. It encompasses customer ordering, restaurant kitchen workflows, delivery partner assignment with live tracking, administrative governance, Razorpay test payments, background messaging, and Docker infrastructure.

### Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Monorepo Manager** | `pnpm` (Workspaces v11) | Efficient package deduplication, workspace dependency isolation |
| **Backend API** | NestJS (Express), Node.js (v22), TypeScript | Modular REST API and WebSocket gateway |
| **Database & ORM** | PostgreSQL 17, Prisma ORM 6 | Relational data persistence, schema migrations, and type-safe querying |
| **Cache & Real-time** | Redis 7, Socket.IO 4 | Fast menu caching, live status rooms, and location telemetry |
| **Asynchronous Queue** | RabbitMQ 4 (Management UI) | Reliable event publishing, dead-letter retries, and decoupled notifications |
| **Payments** | Razorpay Test Integration | Server-side order creation, HMAC signature verification, webhook deduplication |
| **Frontend Apps** | Next.js 15 (App Router), React 19, Tailwind CSS | 4 role-based web portals (Customer, Restaurant, Delivery, Admin) |
| **State & Data Fetching**| Zustand, TanStack Query, Lucide Icons | Responsive UI state, client-side caching, and modern icons |
| **Containerization & CI** | Docker Compose, Multi-stage Dockerfiles, GitHub Actions | Local reproducible environment and automated validation pipeline |

---

## 2. Monorepo Directory & Folder Hierarchy

```
fooapp/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # GitHub Actions CI for linting, testing, and building
│       └── deploy.yml                 # Staging deployment and Docker packaging workflow
├── apps/                              # Client Frontend Applications
│   ├── customer-web/                  # Next.js Customer Ordering Portal (:3000)
│   │   ├── app/                       # App Router (page.tsx, layout.tsx, globals.css)
│   │   ├── components/                # Reusable UI components and site layout
│   │   ├── features/                  # Domain components (auth, restaurants, cart, tracking)
│   │   ├── lib/                       # API fetch client and Zustand cart store
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   ├── restaurant-dashboard/          # Next.js Kitchen Display & Order Portal (:3002)
│   │   ├── app/                       # Live kitchen pipeline (Incoming -> Cooking -> Ready)
│   │   ├── components/                # Layout and UI primitives
│   │   ├── features/                  # Order card actions and menu item availability toggles
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   ├── delivery-dashboard/            # Next.js Delivery Partner Portal (:3003)
│   │   ├── app/                       # Active trip view, pickup/deliver buttons, GPS simulator
│   │   ├── components/                # Trip step indicators
│   │   ├── features/                  # Location streaming and status updates
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   └── admin-dashboard/               # Next.js Master Admin Governance Console (:3004)
│       ├── app/                       # GMV, user stats, restaurant review table, audit controls
│       ├── components/                # Stat cards, action modals
│       ├── package.json
│       ├── tailwind.config.js
│       └── tsconfig.json
│
├── services/                          # Microservices Directory
│   ├── api-gateway/                   # Microservices API Gateway & WebSocket Hub (:3001)
│   │   ├── src/health/                # Centralized health probe across all microservices
│   │   ├── src/proxy/                 # Routing, reverse proxying, & WebSocket event dispatch
│   │   └── package.json, tsconfig.json, nest-cli.json
│   │
│   ├── auth-service/                  # Authentication & Identity Microservice (:4001)
│   │   ├── src/auth/                  # Registration, login, token rotation, user profiles
│   │   └── src/prisma/                # Microservice database access
│   │
│   ├── restaurant-service/            # Restaurant & Menu Microservice (:4002)
│   │   ├── src/restaurants/           # Kitchen profiles, menu categories, item availability
│   │   └── src/prisma/
│   │
│   ├── order-service/                 # Order Lifecycle & Checkout Microservice (:4003)
│   │   ├── src/orders/                # Cart validation, server pricing quotes, order creation
│   │   └── src/prisma/
│   │
│   ├── payment-service/               # Razorpay Payments & Webhooks Microservice (:4004)
│   │   ├── src/payments/              # Server-side order creation, HMAC signature verification, deduplication
│   │   └── src/prisma/
│   │
│   ├── delivery-service/              # Delivery Partner & Tracking Microservice (:4005)
│   │   ├── src/delivery/              # Job pooling, concurrent assignment locking, GPS telemetry
│   │   └── src/prisma/
│   │
│   └── notification-service/          # Background Events & Notifications Microservice (:4006)
│       ├── src/notifications/         # RabbitMQ consumers, async event subscribers, alert store
│       └── src/prisma/
│
├── packages/
│   ├── shared-types/                  # Shared TypeScript interfaces, enums, Socket.IO & RabbitMQ events
│   ├── validation/                    # Zod schemas, paise currency conversion, order transition rules
│   ├── eslint-config/                 # Shared ESLint configuration
│   └── tsconfig/                      # Base, NestJS, and Next.js tsconfig presets
│
├── infra/
│   ├── nginx/
│   │   └── nginx.conf                 # Reverse proxy routing for API, WebSockets, and Web
│   └── docker/
│       ├── Dockerfile.api             # Multi-stage production container for NestJS API
│       └── Dockerfile.web             # Multi-stage production container for Next.js Web
│
├── prisma/
│   ├── schema.prisma                  # Comprehensive relational database schema
│   └── seed.ts                        # Seeding script with demo users, restaurants, and menu items
│
├── docs/                              # Project technical documentation
│   └── SYSTEM_DOCUMENTATION.md        # Detailed breakdown of everything created in the app
│
├── docker-compose.yml                 # PostgreSQL 17 (port 5433), Redis 7, RabbitMQ 4
├── pnpm-workspace.yaml                # Workspace package mappings
├── package.json                       # Monorepo root scripts and dependencies
├── .env.example                       # Documented environment variables template
├── .env                               # Local development configuration
├── .gitignore                         # Standard ignore rules
└── README.md                          # Quick start instructions
```

---

## 3. Database Schema & Models (`prisma/schema.prisma`)

The database is built on PostgreSQL using integer paise arithmetic (`pricePaise`, `subtotalPaise`, `taxPaise`, `totalPaise`) to completely prevent floating-point calculation errors.

### Enums
- **`UserRole`**: `CUSTOMER`, `RESTAURANT_OWNER`, `DELIVERY_PARTNER`, `ADMIN`
- **`RestaurantStatus`**: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- **`OrderStatus`**: `PENDING_PAYMENT`, `PLACED`, `ACCEPTED`, `PREPARING`, `READY_FOR_PICKUP`, `PICKED_UP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `REJECTED`
- **`PaymentStatus`**: `CREATED`, `PENDING`, `PAID`, `FAILED`, `REFUND_PENDING`, `REFUNDED`
- **`DeliveryStatus`**: `UNASSIGNED`, `ASSIGNED`, `ACCEPTED`, `PICKED_UP`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`

### Models (17 Relational Entities)
1. **`User`**: Core account details, password hash, role, activation state.
2. **`RefreshSession`**: Stores SHA-256 hashed refresh tokens for secure session rotation and revocation.
3. **`Address`**: Saved customer addresses with coordinates, pincode, and default selection.
4. **`Restaurant`**: Kitchen details, owner association, geographic location, approval status.
5. **`MenuCategory`**: Sortable sections (e.g. Starters, Main Course, Beverages).
6. **`MenuItem`**: Name, description, price in paise, image URL, availability status.
7. **`Order`**: Source of truth for orders, snapshot of destination address, price breakdown, status.
8. **`OrderItem`**: Historical snapshot of item name and unit price at time of order creation.
9. **`Payment`**: Payment record linking order with Razorpay order ID, payment ID, and signature.
10. **`WebhookEvent`**: Audit log of provider webhook events to ensure idempotent processing.
11. **`DeliveryProfile`**: Delivery partner vehicle type and online/available toggle.
12. **`Delivery`**: Assignment linkage between order and partner, milestone timestamps.
13. **`DeliveryLocation`**: Breadcrumb history of partner GPS coordinates.
14. **`OrderEvent`**: Immutable audit log of every order status transition, actor ID, and note.
15. **`Notification`**: In-app notifications for users.
16. **`Review`**: Customer ratings and comments for orders and restaurants.
17. **`AdminAuditLog`**: Logs sensitive administrative decisions (approvals, suspensions, refunds).

---

## 4. Backend Domain Capabilities & Endpoints

The backend capabilities are organized into clear domain modules across the microservices:

1. **`AuthModule`**:
   - `POST /api/v1/auth/register`: Public customer registration. Strictly enforces RBAC: any user registering from the user portal is assigned `role: CUSTOMER` in PostgreSQL, preventing privilege escalation.
   - `POST /api/v1/auth/login`: Authenticates bcrypt password hash, creates a database `RefreshSession` (7d expiry), and returns JWT `accessToken` (15m) + `refreshToken` (7d).
   - `GET /api/v1/auth/me`: Verifies JWT Bearer token signature and expiration, looks up active status in PostgreSQL, and returns profile.
   - `POST /api/v1/auth/refresh`: Validates refresh token against database `RefreshSession`, rotates tokens, and revokes prior session.
   - `POST /api/v1/auth/logout`: Revokes database `RefreshSession` and invalidates client session.

2. **`UsersModule`**:
   - `GET /api/v1/users/me`: Current user profile, addresses, and delivery profiles.
   - `PATCH /api/v1/users/me`: Profile updates.
   - `GET /api/v1/users/me/addresses`: List saved addresses.
   - `POST /api/v1/users/me/addresses`: Save new delivery address.

3. **`RestaurantsModule`**:
   - `GET /api/v1/restaurants`: Public search for approved restaurants.
   - `GET /api/v1/restaurants/:id`: Restaurant profile and categories.
   - `GET /api/v1/restaurants/:id/menu`: Available menu items.
   - `POST /api/v1/owner/restaurants`: Restaurant owner onboarding application.
   - `PATCH /api/v1/owner/restaurants/:id`: Update restaurant details (ownership checked).

4. **`MenusModule`**:
   - `POST /api/v1/owner/restaurants/:id/categories`: Add menu category.
   - `POST /api/v1/owner/categories/:id/items`: Add dish with price in paise.
   - `PATCH /api/v1/owner/items/:id`: Edit item details.
   - `PATCH /api/v1/owner/items/:id/availability`: Toggle item availability in real-time.

5. **`CartModule`**:
   - `GET /api/v1/cart`: Fetch user's cart.
   - `PUT /api/v1/cart/items/:itemId`: Update quantity; automatically handles single-restaurant enforcement.
   - `DELETE /api/v1/cart/items/:itemId`: Remove item.

6. **`CheckoutModule`**:
   - `POST /api/v1/checkout/quote`: Server calculates exact subtotal, 5% GST tax, and delivery fee (₹40, free above ₹500).

7. **`OrdersModule`**:
   - `POST /api/v1/orders`: Atomic database transaction creates Order, OrderItems, Payment (CREATED), and Delivery (UNASSIGNED).
   - `GET /api/v1/orders`: Customer order history.
   - `GET /api/v1/orders/:id`: Full order details (role-protected).
   - `POST /api/v1/orders/:id/cancel`: Allowed before preparation starts.
   - `GET /api/v1/owner/orders`: Kitchen incoming orders queue.
   - `PATCH /api/v1/owner/orders/:id/status`: Transitions order (ACCEPTED, REJECTED, PREPARING, READY_FOR_PICKUP).

8. **`PaymentsModule`**:
   - `POST /api/v1/payments/razorpay/order`: Generates Razorpay server order.
   - `POST /api/v1/payments/razorpay/verify`: Validates HMAC-SHA256 signature and advances order to `PLACED`.
   - `GET /api/v1/payments/:id`: Fetch payment status.

9. **`WebhooksModule`**:
   - `POST /api/v1/webhooks/razorpay`: Verifies webhook signatures, deduplicates with `WebhookEvent`, and idempotently marks orders as paid.

10. **`DeliveryModule`**:
    - `GET /api/v1/delivery/jobs`: Available jobs (READY_FOR_PICKUP & UNASSIGNED).
    - `POST /api/v1/delivery/jobs/:id/accept`: Transactional assignment preventing race conditions.
    - `PATCH /api/v1/delivery/jobs/:id/status`: Transitions delivery (`PICKED_UP`, `IN_TRANSIT`, `DELIVERED`).
    - `GET /api/v1/delivery/active`: Active trip for the authenticated partner.
    - `GET /api/v1/delivery/history`: Completed trips.

11. **`TrackingModule`**:
    - `POST /api/v1/delivery/location`: Submits partner GPS coordinates and logs breadcrumbs.
    - `GET /api/v1/orders/:id/tracking`: Current order status and latest partner coordinates.

12. **`RealtimeModule` (Socket.IO)**:
    - Gateway managing WebSocket connections on room `order_{orderId}`.
    - Broadcasts `order:status` and `delivery:location` in real-time.

13. **`NotificationsModule`**:
    - RabbitMQ client configured with `food_events` exchange and durable topic queues.
    - Fallback mechanism writes to local database if RabbitMQ is unavailable.

14. **`AdminModule`**:
    - `GET /api/v1/admin/overview`: Platform KPIs (GMV, total orders, users, pending approvals).
    - `GET /api/v1/admin/users`: Search and inspect users.
    - `PATCH /api/v1/admin/users/:id/status`: Activate/deactivate accounts with audit logging.
    - `GET /api/v1/admin/restaurants`: Review applications.
    - `PATCH /api/v1/admin/restaurants/:id/status`: Approve, reject, or suspend restaurants.
    - `GET /api/v1/admin/audit-logs`: Query administrative audit trail.

15. **`HealthModule`**:
    - `GET /api/v1/health`: Checks API status and executes a live PostgreSQL database query (`SELECT 1`).

16. **`PrismaModule`**:
    - Global module providing lifecycle-managed `PrismaService`.

---

## 5. Frontend Portals

All four frontend applications are built with **Next.js 15**, **React 19**, and **Tailwind CSS**:

1. **`apps/customer-web`** (`http://localhost:3000`):
   - **Discovery & Home Page (`/`)**: Pixel-accurate implementation of Stitch screen `9d4e60c452854eda9c30883dcc5b9210`:
     - **Live Courier Dispatch Ticker**: Real-time average delivery times, temperature assurance, and 100% compostable packaging badges.
     - **Michelin Edition Hero Banner**: Charcoal backdrop, countdown timer, `EPICUREAN` promo code with one-click copy, and *L'Atelier Charcoal Wagyu* chef highlight.
     - **Dynamic Category Navigation**: Real-time filtering across Artisan Pizza, Ramen & Bowls, Gourmet Burgers, Sushi & Poke, Healthy Greens, and Bakery.
     - **Trending Around You**: Real database culinary establishments (*Umai Ramen & Izakaya*, *Tartine Artisan Bakery*, *Nori Bistro & Sushi*, *Lucia Wood-Fired Pizza*) with interactive *Quick Reorder* card.
     - **Speedy Cravings (< 25 min)**: Rapid-dispatch restaurants (*Smash & Co.*, *Olive & Thyme Greens*, *Tacos Del Sol*, *Kinfolk Roastery*) with dedicated tags.
     - **Real Kitchen Menu Modal**: Clicking any restaurant loads its full categorized menu and items directly from PostgreSQL with description, pricing in paise, and direct addition to the Zustand cart store.
   - **Stitch Design UI Authentication Screens**:
     - **`/login`**: Pixel-accurate implementation of Stitch screen `9bc6910e7e4c42568814b9f575668ab4` featuring terracotta (`#ab2f00`) & emerald (`#006c49`) branding, ambient artisan food artwork, Deliver to / Cart top header, partner portal switcher, and interactive password visibility toggles. Dispatches to `POST /api/v1/auth/login`.
     - **`/register`**: Corresponding registration experience with Full Name, Email Address, Phone Number, Password validation, Terms of Service acceptance, and Epicurean Guild perks toggle. Dispatches to `POST /api/v1/auth/register` (enforcing RBAC `role: CUSTOMER`).

2. **`apps/restaurant-dashboard`** (`http://localhost:3002`):
   - Kitchen Display System (KDS) categorized into 3 pipelines:
     - **Incoming Orders** (Accept / Reject)
     - **Kitchen Cooking** (Mark Ready for Pickup)
     - **Ready for Delivery** (Awaiting Delivery Partner)
   - Real-time kitchen online status badge.

3. **`apps/delivery-dashboard`** (`http://localhost:3003`):
   - Partner availability toggle (Online / Offline).
   - Active trip screen showing Pickup Restaurant and Customer Drop addresses.
   - Buttons to Confirm Pickup and Mark Delivered.
   - Simulated GPS broadcast telemetry.

4. **`apps/admin-dashboard`** (`http://localhost:3004`):
   - Platform KPI summary (Total Users, Approved Kitchens, Pending Approvals, Total GMV).
   - Restaurant onboarding application review table (Approve / Reject / Suspend).
   - Direct link to Swagger API documentation.

---

## 6. Shared Workspace Packages

- **`@food-platform/shared-types`**:
  - Centralized enums (`UserRole`, `OrderStatus`, `PaymentStatus`, etc.).
  - Data transfer interfaces and response envelopes (`ApiResponse<T>`, `PaginatedResponse<T>`).
  - Event constant dictionaries (`SocketEvents`, `RabbitMQEvents`).
- **`@food-platform/validation`**:
  - Currency helpers (`rupeesToPaise`, `paiseToRupees`, `formatPaiseToCurrency`).
  - State machine transition validator (`isValidOrderTransition`).
  - Zod validation schemas (`registerSchema`, `createOrderSchema`, `locationUpdateSchema`).
- **`@food-platform/tsconfig`**:
  - Shared TypeScript configurations (`base.json`, `nestjs.json`, `nextjs.json`).
- **`@food-platform/eslint-config`**:
  - Shared ESLint rules across apps and libraries.

---

## 7. Microservices Directory Architecture (`services/`)

The platform includes a dedicated **`services/`** directory containing 7 decoupled, independently deployable NestJS microservices. Each service maintains its own lifecycle, `package.json`, `tsconfig.json`, and business boundaries:

| Microservice | Default Port | Primary Responsibilities | Communication Pattern |
| :--- | :--- | :--- | :--- |
| **`api-gateway`** | `:3001` | Client entrypoint, reverse proxy, Socket.IO gateway, aggregated Swagger | HTTP REST, WebSockets |
| **`auth-service`** | `:4001` | User registration, login, JWT issuance, session rotation, profiles & addresses | HTTP REST |
| **`restaurant-service`** | `:4002` | Public discovery, owner kitchen CRUD, menu categories, availability toggles | HTTP REST, Redis Cache |
| **`order-service`** | `:4003` | Cart store, server-side quote calculation (paise, GST), order creation & lifecycle | HTTP REST, Database Tx |
| **`payment-service`** | `:4004` | Razorpay server orders, client signature verification, webhook deduplication | HTTP REST, HMAC SHA-256 |
| **`delivery-service`** | `:4005` | Delivery partner availability, atomic job claiming, real-time GPS telemetry | HTTP REST, WebSockets |
| **`notification-service`**| `:4006` | Consumes async events (`food_events`), in-app alerts, email/SMS dispatch | AMQP RabbitMQ, Topics |

### Microservice Interaction & Event Flow
1. **Client Request**: Frontend apps send requests to the **API Gateway** (`http://localhost:3001/api/v1`).
2. **Reverse Proxying**: The Gateway delegates requests to the appropriate internal microservices (e.g. `/auth/*` -> `:4001`, `/restaurants/*` -> `:4002`, `/orders/*` -> `:4003`).
3. **Data Consistency**: Domain services use PostgreSQL and Prisma for relational integrity with transactions where multi-table consistency is mandatory.
4. **Asynchronous Events**: Order and payment state changes publish durable topic events (`order.placed`, `order.accepted`, `delivery.assigned`) to RabbitMQ. The `notification-service` listens on `#` and logs alerts.
5. **Real-Time Telemetry**: The Delivery Service accepts GPS coordinates from delivery partners and the API Gateway broadcasts coordinates to subscribed order tracking rooms via Socket.IO.

---

## 8. Infrastructure, Docker & Deployment

- **`docker-compose.yml`**:
  - **PostgreSQL 17**: Exposed on port `5433:5432` with healthcheck (`pg_isready`).
  - **Redis 7 (Alpine)**: Port `6379:6379` with AOF persistence.
  - **RabbitMQ 4**: Ports `5672:5672` (AMQP) and `15672:15672` (Management Dashboard).
- **`infra/nginx/nginx.conf`**:
  - Reverse proxy routing `/api/` and WebSocket `/socket.io/` to backend, and `/` to customer frontend.
- **`infra/docker/Dockerfile.api` & `Dockerfile.web`**:
  - Multi-stage Docker builds utilizing pnpm for lean production images.
- **`.github/workflows/ci.yml`**:
  - Automated CI running on push/PR with PostgreSQL and Redis test services.

---

## 9. Development Commands & Workflow

### 1. Installation
```bash
pnpm install
```

### 2. Launch Local Containers
```bash
docker compose up -d
docker compose ps
```

### 3. Database Migration & Seeding
```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

### 4. Running Microservices
```bash
# Start all microservices in parallel:
pnpm dev:services

# Or start individual microservices:
pnpm dev:gateway             # http://localhost:3001 (API Gateway & Swagger)
pnpm dev:auth                # http://localhost:4001 (Auth Service)
pnpm dev:restaurant-service  # http://localhost:4002 (Restaurant Service)
pnpm dev:order-service       # http://localhost:4003 (Order Service)
pnpm dev:payment-service     # http://localhost:4004 (Payment Service)
pnpm dev:delivery-service    # http://localhost:4005 (Delivery Service)
pnpm dev:notification-service# http://localhost:4006 (Notification Service)
```

### 5. Running Frontend Apps
```bash
# Start all frontend apps simultaneously
pnpm dev

# Or start individually:
pnpm dev:customer     # http://localhost:3000
pnpm dev:restaurant   # http://localhost:3002
pnpm dev:delivery     # http://localhost:3003
pnpm dev:admin        # http://localhost:3004
```

### 6. Running Tests & Builds
```bash
pnpm build            # Builds all shared packages, services, and frontend apps
pnpm test             # Runs test suites
```

### 7. Interactive Swagger Documentation
Open in your browser:
**`http://localhost:3001/api/docs`**
