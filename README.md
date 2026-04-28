# PropertyPortal

A modern property management portal built with React, Express, and Supabase. Admins manage properties, customers, and service requests. Customers view their properties, invoices, statements, and submit requests.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Vite · TypeScript · Tailwind CSS · shadcn/ui |
| Backend | Express · TypeScript · Passport JWT · Zod |
| Database | Supabase (PostgreSQL) |
| Auth | JWT · bcrypt (admin) · OTP (customer) |

## Quick Start

### 1. Database Setup

Run these SQL files in **Supabase Dashboard → SQL Editor** (in order):

```
supabase/migration.sql     ← creates all tables
supabase/disable_rls.sql   ← disables Row Level Security
supabase/seed.sql           ← inserts sample data
```

### 2. Server

```bash
cd server
npm install
```

Create `server/.env`:
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
JWT_SECRET=your-super-secret-jwt-key-change-me
PORT=3001
NODE_ENV=development
BANK_ACCOUNT_NAME=PropertyPortal Ltd
BANK_SORT_CODE=00-00-00
BANK_ACCOUNT_NUMBER=00000000
```

```bash
npm run build
npm start         # http://localhost:3001
```

### 3. Client

```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

```bash
npm run dev       # http://localhost:5173
```

## Default Accounts

| Email | Role | Credentials |
|-------|------|------------|
| `admin@propertyportal.com` | Admin | Password: `Admin1234!` |
| `jane.smith@example.com` | Customer | OTP: `123456` |
| `john.doe@example.com` | Customer | OTP: `123456` |

## Features

### Customer Portal (`/login`)
- **Dashboard** — view linked properties with outstanding invoice counts
- **Property Details** — invoices and statements per property
- **Documents** — all invoices and statements across properties
- **Service Requests** — view requests and submit new ones (Pet Request, Alteration Request, General Enquiry)

### Admin Portal (`/admin/login`)
- **Dashboard** — stats overview (customers, properties, open requests, imports)
- **User Management** — view, search, activate/deactivate users
- **Service Requests** — review and update request statuses (Submitted → In Review → Resolved)
- **Data Import** — bulk import properties, customer links, and invoices via CSV/Excel

## Adding Data

### Add Properties (Admin → Data Import)

Upload a CSV with these columns:

```csv
external_ref,address_line1,address_line2,city,postcode,property_type,customer_email,invoice_number,invoice_amount,invoice_status,invoice_issue_date,invoice_due_date
EXT-301,10 Downing Street,Flat 1,London,SW1A 2AA,Apartment,jane.smith@example.com,INV-001,1450.00,unpaid,2026-04-01,2026-04-30
```

A sample file is provided at `sample_import.csv`.

### Add Users (Supabase SQL)

```sql
-- New customer
INSERT INTO users (id, tenant_id, email, role, is_active) VALUES
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001',
   'newuser@example.com', 'customer', true);

-- New admin (generate bcrypt hash first)
INSERT INTO users (id, tenant_id, email, password_hash, role, is_active) VALUES
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001',
   'newadmin@example.com', '$2a$12$BCRYPT_HASH', 'admin', true);
```

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/request-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP → JWT |
| POST | `/api/auth/admin/login` | Admin login → JWT |

### Customer (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | User's linked properties |
| GET | `/api/properties/:id` | Property details |
| GET | `/api/properties/:id/invoices` | Property invoices |
| GET | `/api/properties/:id/statements` | Property statements |
| GET | `/api/service-requests` | User's service requests |
| POST | `/api/service-requests` | Submit new request |
| GET | `/api/documents/invoices` | All user invoices |
| GET | `/api/documents/statements` | All user statements |

### Admin (JWT + admin role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | List users (paginated) |
| PATCH | `/api/admin/users/:id` | Toggle user active status |
| GET | `/api/admin/service-requests` | All service requests |
| PATCH | `/api/admin/service-requests/:id` | Update request status |
| POST | `/api/admin/import` | Bulk import data |
| GET | `/api/admin/imports` | Import history |

## Project Structure

```
PropertyManagement/
├── client/                 # React frontend
│   └── src/
│       ├── api/            # API client functions
│       ├── components/     # Reusable UI components
│       ├── context/        # Auth context
│       ├── hooks/          # React Query hooks
│       ├── pages/          # Route pages
│       │   ├── admin/      # Admin pages
│       │   ├── auth/       # Login pages
│       │   └── customer/   # Customer pages
│       ├── schemas/        # Zod validation schemas
│       └── types/          # TypeScript interfaces
├── server/                 # Express backend
│   └── src/
│       ├── config/         # Supabase client
│       ├── middleware/     # Auth, validation, error handling
│       ├── routes/         # API route handlers
│       ├── schemas/        # Zod request schemas
│       └── types/          # TypeScript types
├── supabase/               # Database scripts
│   ├── migration.sql       # Table creation
│   ├── seed.sql            # Sample data
│   └── disable_rls.sql    # Disable Row Level Security
└── sample_import.csv       # Example import file
```

## License

MIT
