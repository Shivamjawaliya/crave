# Crave — Food Delivery & Restaurant Platform

A production-grade, modular full-stack food delivery platform built with **NestJS**, **Next.js**, **PostgreSQL**, **Prisma ORM**, **Redis**, **RabbitMQ**, **Socket.IO**, and **Razorpay**.

---

## 🏗️ Architecture & Repository Structure

```
crave/
├── apps/
│   ├── customer-web/          # Next.js customer ordering portal (:3000)
│   ├── restaurant-dashboard/  # Kitchen display & order management (:3002)
│   ├── delivery-dashboard/    # Delivery partner portal & live GPS tracking (:3003)
│   └── admin-dashboard/       # System oversight, approvals, and audits (:3004)
├── services/                  # Microservices Directory
│   ├── api-gateway/           # API Gateway & real-time WebSocket hub (:3001)
│   ├── auth-service/          # Authentication & user profile service (:4001)
│   ├── restaurant-service/    # Restaurant & menu management service (:4002)
│   ├── order-service/         # Cart, checkout quote, & order lifecycle (:4003)
│   ├── payment-service/       # Razorpay payments & webhook service (:4004)
│   ├── delivery-service/      # Delivery assignment & GPS tracking (:4005)
│   └── notification-service/  # RabbitMQ async event consumer (:4006)
├── packages/
│   ├── shared-types/          # Shared TypeScript interfaces, enums, events
│   ├── validation/            # Common Zod validation & currency helpers
│   ├── eslint-config/         # Shared ESLint configuration
│   └── tsconfig/              # Shared TypeScript configurations
├── infra/
│   ├── nginx/                 # Nginx reverse proxy & WebSocket configuration
│   └── docker/                # Multi-stage production Dockerfiles
├── prisma/
│   ├── schema.prisma          # PostgreSQL relational schema
│   └── seed.ts                # Database seeder (users, restaurants, menus)
├── docker-compose.yml         # Local infrastructure (Postgres 17, Redis 7, RabbitMQ 4)
├── pnpm-workspace.yaml        # Workspace configuration
└── package.json               # Monorepo task orchestration
```

---

## ⚡ Quick Start Guide

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Core Infrastructure (Docker)
```bash
docker compose up -d
```
Starts:
- **PostgreSQL 17**: `localhost:5433` (avoiding local 5432 collisions)
- **Redis 7 (Alpine)**: `localhost:6379`
- **RabbitMQ 4 (Management UI)**: `localhost:5672` & `http://localhost:15672`

### 3. Generate Prisma Client & Migrate
```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

### 4. Run Microservices & Frontends
```bash
# Start all microservices in parallel
pnpm dev:services

# Start all frontend portals in parallel
pnpm dev

# Or run individual apps:
pnpm dev:gateway      # http://localhost:3001 (Gateway & Swagger docs)
pnpm dev:customer     # http://localhost:3000
pnpm dev:restaurant   # http://localhost:3002
pnpm dev:delivery     # http://localhost:3003
pnpm dev:admin        # http://localhost:3004
```

---

## 🧪 Seeding & Test Credentials

After running `pnpm prisma:seed`, the following accounts are ready:

| Role | Email | Password | Access Port |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@foodapp.com` | `Password@123` | `:3004` / Admin Console |
| **Restaurant Owner** | `owner@spicybites.com` | `Password@123` | `:3002` / Kitchen Portal |
| **Delivery Partner** | `delivery@speedy.com` | `Password@123` | `:3003` / Partner App |
| **Customer** | `customer@gmail.com` | `Password@123` | `:3000` / Ordering Web |

---

## 🛡️ Key Features

- **Strict Server-Side Price Integrity**: All menu prices, taxes (5% GST), and delivery fees are recomputed on the backend during checkout.
- **Race Condition Prevention**: Database transactions and conditional locking prevent multiple delivery partners from claiming the same assignment.
- **Live Tracking**: Socket.IO gateway with authorized room subscriptions and continuous GPS location broadcasting.
- **Razorpay Payments**: Test-mode order creation, client checkout signature verification, and deduplicated webhook processing.
- **Audit Logging**: Sensitive administrative actions (restaurant approvals, user suspensions) are captured in the immutable audit log.
