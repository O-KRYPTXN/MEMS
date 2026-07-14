# 🏥 MEMS — Medical Equipment Management System

A full-stack hospital equipment management platform for tracking devices, work orders, preventive maintenance, spare parts inventory, and fault reporting across multiple departments.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Roles & Portals](#roles--portals)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Seeding the Database](#seeding-the-database)
- [Default Credentials](#default-credentials)

---

## Overview

MEMS is a multi-role internal web application designed for hospital biomedical engineering departments. It provides a centralized platform to:

- Track the full lifecycle of medical devices
- Manage corrective and preventive maintenance work orders
- Process fault reports submitted by department staff
- Control spare parts inventory and purchase orders
- Coordinate technician teams under supervisor oversight
- Generate compliance and audit reports

---

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with `httpOnly` cookies
- Role-based access control (RBAC) — 5 distinct roles
- Self-registration workflow with admin approval
- Account activation via token-based link

### 🖥️ Admin Portal
- Full CRUD for users, departments, devices, and inventory
- Approve/reject user registration requests
- Create and manage work orders from fault reports
- Review and approve store purchase orders
- Audit log viewer for compliance tracking
- Exportable reports (Equipment, Maintenance, Inventory, Financial, Compliance)

### 🧑‍💼 Supervisor Portal
- Dashboard with live KPIs and team workload overview
- Approve or reject corrective work orders (PENDING_APPROVAL)
- Assign work orders to technicians
- View and triage pending fault reports
- Monitor PM task schedules and overdue tasks

### 🔧 Technician Portal
- Personal work order queue (filtered to assigned tasks)
- Update work order status (IN_PROGRESS → PENDING_APPROVAL)
- Request spare parts from the central store
- Access device details and history
- Submit completed PM tasks

### 🏨 Department Portal
- Submit fault reports for faulty devices
- Track the status of submitted reports (Pending → In Progress → Solved)
- View devices assigned to the department

### 🏪 Storekeeper Portal
- Manage spare parts inventory (stock in/out)
- Review and fulfill part requests from technicians
- Create and manage purchase orders from suppliers
- Track low-stock alerts

### 🔔 Real-Time Notifications
- Dynamic sidebar badges showing live counts of pending actions per role
- In-app alert center powered by Socket.IO
- Unread notification tracking

### 🌐 Internationalization
- Full i18n support (English / Arabic) via `react-i18next`
- Persistent language preference per user

### 🎨 UI/UX
- Fully responsive dark/light mode (persisted per user)
- Glassmorphism-inspired design system
- Per-role color theming (Blue/Admin, Teal/Supervisor, Amber/Technician, Pink/Department, Purple/Store)
- Smooth transitions and micro-animations

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite | Core framework & build tool |
| Tailwind CSS v4 | Utility-first styling |
| React Router v7 | Client-side routing |
| TanStack Query v5 | Server state management & caching |
| Zustand v5 | Client state (auth, notifications) |
| React Hook Form v7 | Form state & validation |
| Recharts | Charts & data visualizations |
| Axios | HTTP client |
| i18next | Internationalization |
| Socket.IO Client | Real-time events |
| clsx | Conditional classNames |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express v5 | API server |
| Prisma ORM v7 | Database access layer |
| PostgreSQL | Relational database |
| JWT + bcryptjs | Authentication |
| Socket.IO | Real-time delivery |
| Zod | Request validation |
| PDFKit | Report generation |
| dotenv | Environment config |

---

## Architecture

```
MEMS/
├── backend/          # Express REST API
│   ├── prisma/       # Schema, migrations, seed
│   └── src/
│       ├── config/   # env, db, resend config
│       ├── middleware/  # auth, authorize, error, validation
│       ├── modules/  # Feature modules (see below)
│       ├── routes/   # Central router (index.js)
│       ├── services/ # Shared services (e.g. socket)
│       └── utils/    # AppError, pagination, JWT helpers
│
└── frontend/         # React SPA
    └── src/
        ├── api/      # Axios service functions per entity
        ├── components/ # Reusable UI, charts, forms, tables
        ├── constants/  # roles.js, routes.js, statusTypes.js
        ├── hooks/    # useAuth, useDebounce, useNotifications
        ├── layouts/  # Per-role layout wrappers + sidebars
        ├── pages/    # One folder per role
        ├── router/   # index.jsx + ProtectedRoute.jsx
        ├── store/    # authStore.js, notificationStore.js
        └── utils/    # formatDate, formatStatus, roleHelpers
```

### Backend Module Structure

Every feature follows the same module pattern:

```
modules/feature/
├── feature.routes.js       # Endpoints + middleware
├── feature.controller.js   # req/res handling
├── feature.service.js      # Business logic + Prisma queries
└── feature.validation.js   # Zod schemas
```

**Active Modules:** `auth`, `users`, `departments`, `devices`, `workOrders`, `pmTasks`, `faultReports`, `parts`, `partRequests`, `storeOrders`, `alerts`, `auditLogs`, `registrationRequests`, `reports`

---

## Roles & Portals

| Role | Portal Route | Description |
|---|---|---|
| `ADMIN` | `/admin/*` | Full platform access |
| `SUPERVISOR` | `/supervisor/*` | Department team oversight |
| `TECHNICIAN` | `/technician/*` | Assigned maintenance tasks |
| `DEPARTMENT` | `/department/*` | Device fault reporting |
| `STORE` | `/store/*` | Inventory & procurement |

---

## Project Structure

### Frontend Pages per Role

```
pages/
├── admin/          Dashboard, Devices, WorkOrders, Users, Departments,
│                   Inventory, FaultReports, PM, Reports, AuditLogs, Orders
├── supervisor/     Dashboard, WorkOrders, Devices, FaultReports,
│                   Inventory, Team, PM, Requests
├── technician/     Dashboard, WorkOrders, Devices, Inventory, Notifications
├── department/     Dashboard, Requests (Fault Reports)
├── store/          Dashboard, Inventory, Requests, Orders, CreateOrder, Rejected
├── shared/         Profile
└── auth/           Login, Signup, SetPassword
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14

### 1. Clone the repository

```bash
git clone <repo-url>
cd MEMS
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure environment variables

Copy `.env.example` to `.env` in the `backend/` directory and fill in your values (see [Environment Variables](#environment-variables)).

### 5. Apply database migrations

```bash
cd backend
npx prisma migrate dev
```

### 6. Seed the database

```bash
npm run db:seed
```

### 7. Start the development servers

**Backend** (runs on `http://localhost:5000`):
```bash
cd backend
npm run dev
```

**Frontend** (runs on `http://localhost:5173`):
```bash
cd frontend
npm run dev
```

---

## Environment Variables

Create a `backend/.env` file with the following:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mems_db?schema=public"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET="your-strong-secret-here"

# Frontend (used for CORS)
FRONTEND_URL=http://localhost:5173
```

Create a `frontend/.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## API Reference

All API routes are prefixed with `/api`.

| Resource | Base Path |
|---|---|
| Authentication | `/api/auth` |
| Users | `/api/users` |
| Departments | `/api/departments` |
| Devices | `/api/devices` |
| Work Orders | `/api/work-orders` |
| PM Tasks | `/api/pm-tasks` |
| Fault Reports | `/api/fault-reports` |
| Parts | `/api/parts` |
| Part Requests | `/api/part-requests` |
| Store Orders | `/api/store-orders` |
| Alerts | `/api/alerts` |
| Audit Logs | `/api/audit-logs` |
| Registrations | `/api/registrations` |
| Reports | `/api/reports` |

### Auth Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | ❌ | Login with email + password |
| `POST` | `/api/auth/signup` | ❌ | Submit registration request |
| `POST` | `/api/auth/logout` | ✅ | Logout |
| `GET` | `/api/auth/me` | ✅ | Get current user |
| `PATCH` | `/api/auth/me` | ✅ | Update profile |
| `PATCH` | `/api/auth/me/password` | ✅ | Change password |

---

## Database Schema

The database contains 15 models:

| Model | Description |
|---|---|
| `Department` | Hospital departments (ICU, ER, Surgery, BME…) |
| `User` | All platform users across all roles |
| `Device` | Medical equipment tracked by the system |
| `WorkOrder` | Corrective/PM/Decommission work orders |
| `PMTask` | Scheduled preventive maintenance tasks |
| `Part` | Spare parts in the central inventory |
| `PartRequest` | Requests from technicians for parts |
| `StoreOrder` | Purchase orders to external suppliers |
| `StoreOrderItem` | Line items within a purchase order |
| `FaultReport` | Fault reports submitted by departments |
| `Alert` | System-generated notifications |
| `UserAlert` | Alert delivery pivot table |
| `AuditLog` | Immutable log of all state changes |
| `RegistrationRequest` | Pending user access requests |
| `GeneratedReport` | Saved report exports |

---

## Seeding the Database

The seed script populates all tables with realistic hospital data:

```bash
cd backend
npm run db:seed
```

This creates departments, users for every role, devices, work orders, PM tasks, inventory parts, fault reports, store orders, and a pending registration request.

---

## Default Credentials

> All seeded users share the same password: **`asdfasdf`**

| Role | Email | Portal |
|---|---|---|
| Admin | `admin@mems.local` | `/admin` |
| Supervisor | `supervisor@mems.local` | `/supervisor` |
| Technician | `tech1@mems.local` | `/technician` |
| Technician | `tech2@mems.local` | `/technician` |
| Department (ICU) | `nurse.icu@mems.local` | `/department` |
| Department (ER) | `doc.er@mems.local` | `/department` |
| Storekeeper | `store@mems.local` | `/store` |

---

## License

This project is for internal hospital use. All rights reserved.
