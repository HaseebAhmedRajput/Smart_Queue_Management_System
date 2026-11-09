# Smart Queue & Operations Management System

A production-grade, enterprise Smart Queue & Operations Management System built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase (PostgreSQL, Auth, SSR, and Realtime)**.

Designed with a signature **Midnight Navy & Soft Blue** visual system, this application replaces traditional, chaotic physical queues with deterministic FIFO scheduling, atomic counter dispatching, 120-second no-show timeouts, append-only audit tracking, and role-based access control (RBAC).

---

## Table of Contents
1. [Tech Stack & Architecture](#tech-stack--architecture)
2. [Key Features & Business Rules](#key-features--business-rules)
3. [User Roles & Portals](#user-roles--portals)
4. [Design System & Theme](#design-system--theme)
5. [Project Structure](#project-structure)
6. [Prerequisites & Environment Setup](#prerequisites--environment-setup)
7. [Database Setup & Migrations](#database-setup--migrations)
8. [Initial Administrator Bootstrap](#initial-administrator-bootstrap)
9. [Running the Application](#running-the-application)
10. [Deployment Guide](#deployment-guide)
11. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 1. Tech Stack & Architecture

| Technology | Purpose | Key Details |
| :--- | :--- | :--- |
| **Next.js 15+** | Full-Stack Application Framework | App Router, Server Components & Client Component boundaries, Route Handlers |
| **TypeScript (Strict)** | Type Safety & Robustness | Strict null-checks, exhaustive type definitions for database entities |
| **Tailwind CSS v4** | UI Styling & Utility Classes | Custom design tokens, PostCSS integration, zero bloated CSS files |
| **Supabase PostgreSQL** | Primary Relational Store | Row-Level Security (RLS), custom DB functions, triggers, partial indexes |
| **Supabase Auth** | User Identity & Sessions | Email/password authentication, session persistence, automatic profile triggers |
| **Supabase Realtime** | Live Synchronized Displays | Realtime postgres change subscriptions for instant queue board updates |
| **Recharts** | Analytics & Data Visualization | Status distributions, intake volume, wait/service time trends |
| **Zod** | Validation | Runtime environment variable validation & schema integrity |
| **Lucide React** | Consistent Iconography | Feather-light SVG icons unified across all portals |

---

## 2. Key Features & Business Rules

### 1. Deterministic FIFO Queue Sequencing
- Each ticket is automatically assigned a human-readable display number prefixed by the service code (e.g. `PR-1004` for Passport Renewal, `NID-1005` for National ID).
- Order of service is deterministically governed by `created_at` timestamp and monotonically incrementing sequence numbers.

### 2. Atomic Shelf / Counter Dispatching
- Uses a PostgreSQL stored procedure (`dispatch_next_token_atomic`) with `FOR UPDATE SKIP LOCKED`.
- Eliminates race conditions and prevents multiple concurrent service counters from ever claiming the same ticket.

### 3. Strict 120-Second No-Show Window
- When a ticket status transitions to `called`, the counter station initiates a 120-second countdown.
- **Server-Side Enforcement**: PostgreSQL triggers reject skip actions before 120 seconds have elapsed from `called_at`.
- **Irreversible Progress**: Once an officer clicks **"Start Processing"** (status: `working`), no-show skipping is permanently locked out to prevent administrative tampering.

### 4. Duplicate Active Ticket Prevention
- A citizen profile cannot hold multiple active tickets (`pending`, `called`, `working`) for the same service simultaneously.
- Guaranteed by a PostgreSQL partial unique index:
  ```sql
  CREATE UNIQUE INDEX idx_unique_active_token_per_applicant_service
    ON tokens (applicant_id, service_id)
    WHERE status IN ('pending', 'called', 'working');
  ```

### 5. Multi-Applicant Family Management
- An authenticated account holder can create and maintain separate profiles for family members (`self`, `spouse`, `child`, `parent`, `sibling`, `other`).
- Tickets are tied to the specific applicant rather than just the account, ensuring clean records and compliance.

### 6. Append-Only Audit Trail
- Every status transition (`pending` ➔ `called` ➔ `working` ➔ `successful` / `rejected` / `skipped`) is recorded immutably in `token_events`.
- Ticket rejection requires a mandatory reason, which is permanently logged alongside the acting officer's ID.

---

## 3. User Roles & Portals

The application implements four distinct roles, strictly enforced through Next.js route protection and Supabase Row-Level Security:

```
                            ┌────────────────────────┐
                            │    /login (Auth)       │
                            └───────────┬────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│  Citizen Portal     │      │   Counter Station   │      │ Walk-in Operator    │
│  Role: 'user'       │      │   Role: 'officer'   │      │ Role: 'operator'    │
│  Route: /user       │      │   Route: /officer   │      │ Route: /operator    │
└─────────────────────┘      └─────────────────────┘      └─────────────────────┘
           │                            │                            │
           └────────────────────────────┼────────────────────────────┘
                                        ▼
                             ┌─────────────────────┐
                             │   Admin Console     │
                             │   Role: 'admin'     │
                             │   Route: /admin     │
                             └─────────────────────┘
                                        │
                                        ▼
                             ┌─────────────────────┐
                             │ Public Overhead TV  │
                             │ Route: /kiosk       │
                             └─────────────────────┘
```

### 1. Citizen User (`/user`)
- **Self & Family Management**: Add, update, and manage applicant profiles with National ID / Passport details.
- **Queue Generation**: Select applicant and required service to issue a queue ticket.
- **Live Status Tracking**: View real-time ticket stage, assigned counter station, and estimated wait times.
- **Cancellation**: Ability to cancel tickets that are still in `pending` status.
- **Past History**: Review completed, rejected, or expired tickets.

### 2. Token Operator (`/operator`)
- **Physical Walk-In Intake**: Dedicated interface for front-desk reception staff.
- **Instant Voucher Slip**: Enters visitor name and ID, creates an applicant record, and prints an official intake voucher slip.
- **Restricted Access**: Strictly limited to issuing walk-in tokens. Cannot call tokens, access analytics, or change system settings.

### 3. Operation Officer (`/officer`)
- **Dedicated Workstation**: Assigned to specific service counters / shelves.
- **FIFO Dispatch**: Calls the next eligible pending citizen with one click.
- **120-Second No-Show Timer**: Live countdown before a no-show skip is permitted.
- **Service Workflow**:
  - `Start Processing`: Marks status as `working` and tracks active handling time.
  - `Mark Successful`: Completes the ticket.
  - `Reject`: Requires documentation of a mandatory rejection reason (e.g. invalid documentation).
- **Counter Availability**: Easily pause station for breaks and resume when ready.

### 4. System Administrator (`/admin`)
- **Executive Analytics**: Live metric cards, hourly intake volumes, status distribution pie charts, and average wait/service durations.
- **Universal Queue Monitor**: Search, inspect, and filter every active and historical ticket across all counters.
- **Resource Management**: Add and toggle Floors, Counters/Shelves, and Services.
- **Role-Based Access Control**: Elevate registered citizens to Token Operators or Operation Officers, and assign officers to specific counters.

### 5. Public Kiosk Overhead Display (`/kiosk`)
- **Overhead TV Board**: Clean, high-contrast dashboard displaying "Now Serving" counter stations and upcoming FIFO tickets.
- **Live Audio Announcement Banner**: Highlights newly called tokens (e.g. `Token PR-1004 ➔ Please proceed to Counter 01`).
- **Privacy-First**: Displays only ticket numbers and service names, keeping personal citizen information secure.

---

## 4. Design System & Theme

The UI follows a cohesive **Midnight Navy & Soft Blue** design language:

| Token | Hex Value | Application |
| :--- | :--- | :--- |
| **Dark Navy (Sidebar / Kiosk)** | `#172638` | Navigation sidebar, kiosk headers, high-contrast banners |
| **Primary Navy** | `#24364B` | Primary buttons, active cards, brand headers |
| **Accent Blue** | `#648BB5` | Secondary interactive elements, icons, active borders |
| **Soft Blue** | `#DCE8F5` | Badges, subtle background fills, focus rings |
| **Light Canvas Background** | `#F5F7FA` | Global page background |
| **Card Surface** | `#FFFFFF` | Primary content cards, modals, table surfaces |
| **Body Text** | `#263445` | High-contrast, readable dark text |
| **Muted Text** | `#718096` | Subheadings, timestamps, field descriptions |
| **Border Color** | `#E2E8F0` | Subtle clean card borders and table dividers |

---

## 5. Project Structure

```
├── .env.example                       # Template for environment configuration
├── .gitignore                         # Git exclusion rules
├── README.md                          # Comprehensive project documentation
├── metadata.json                      # AI Studio application metadata
├── package.json                       # Dependencies & scripts
├── postcss.config.mjs                 # PostCSS & Tailwind v4 configuration
├── next.config.mjs                    # Next.js build configuration
├── tsconfig.json                      # Strict TypeScript compiler options
├── supabase/
│   ├── migrations/
│   │   └── 0001_queue_system.sql      # Full PostgreSQL schema, RLS, functions & triggers
│   ├── seed.sql                       # Initial services, floors, and counters
│   └── promote_admin.sql              # Secure one-time admin promotion SQL script
└── src/
    ├── app/
    │   ├── globals.css                # Tailwind CSS imports & base styles
    │   ├── layout.tsx                 # Root layout with typography and AuthProvider
    │   ├── page.tsx                   # Login-first root route with role redirect
    │   ├── login/page.tsx             # User login portal
    │   ├── register/page.tsx          # Citizen account registration
    │   ├── forgot-password/page.tsx   # Password recovery request
    │   ├── verify-email/page.tsx      # Email activation notice
    │   ├── admin/page.tsx             # Admin management & analytics console
    │   ├── officer/page.tsx           # Officer counter workstation
    │   ├── operator/page.tsx          # Front-desk walk-in voucher portal
    │   ├── user/page.tsx              # Citizen family profile & ticket portal
    │   └── kiosk/page.tsx             # Public overhead display TV screen
    ├── config/
    │   └── env.ts                     # Zod environment variable parsing
    ├── styles/
    │   ├── tokens.ts                  # Design tokens (Midnight Navy, Soft Blue, Status colors)
    │   └── theme.ts                   # Standardized component styling helpers
    ├── types/
    │   └── database.ts                # TypeScript interfaces for all DB entities
    ├── lib/
    │   ├── auth-context.tsx           # Supabase Auth context, session management & methods
    │   └── supabase/
    │       ├── client.ts              # Browser Supabase client initialization
    │       ├── server.ts              # Supported Supabase SSR client helper
    │       └── service.ts             # Direct database operations & Realtime channels
    └── components/
        ├── AppShell.tsx               # Main layout with role-filtered sidebar & sign-out
        ├── UserPortal.tsx             # Citizen portal component
        ├── TokenOperatorPortal.tsx    # Walk-in operator component with printable voucher
        ├── OfficerDashboard.tsx       # Officer workstation component with 120s timer
        ├── AdminDashboard.tsx         # Admin dashboard with Recharts visualizations
        ├── PublicLiveQueue.tsx        # Public overhead queue board component
        └── UnconfiguredNotice.tsx     # Setup guide displayed when DB keys are missing
```

---

## 6. Prerequisites & Environment Setup

### Prerequisites
- **Node.js**: v18.18+ or v20+ recommended
- **npm** or **pnpm**
- A free account on [Supabase](https://supabase.com)

### Environment Configuration
1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <repository-url>
   cd smart-queue-system
   ```

2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. Fill in your Supabase project credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

> **Note**: Both keys are safe for public browser execution. The anonymous key is protected by PostgreSQL Row-Level Security policies. **Never** include your `service_role` key in frontend code.

---

## 7. Database Setup & Migrations

To set up your database schema, Row-Level Security rules, and seed data:

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project and navigate to the **SQL Editor** tab on the left sidebar.
3. Click **New query** and paste the entire contents of:
   ```
   supabase/migrations/0001_queue_system.sql
   ```
4. Click **Run** (Ctrl/Cmd + Enter). This will create:
   - `user_role` and `token_status` ENUM types
   - `profiles`, `applicants`, `floors`, `services`, `shelves`, `tokens`, `token_assignments`, and `token_events` tables
   - Partial unique indexes for duplicate ticket prevention
   - The `validate_token_status_transition()` state-machine & 120s timer trigger
   - The `log_token_status_event()` audit trigger
   - The `dispatch_next_token_atomic()` stored procedure
   - Comprehensive Row-Level Security (RLS) policies
   - The `handle_new_user()` trigger for automated user profile creation on signup

5. Open another query window, paste the contents of `supabase/seed.sql`, and click **Run**.
   - Seeds standard government services (Passport, National ID, Driver License, Visas, Attestation).
   - Seeds building floors and initial counter stations with assigned services.

---

## 8. Initial Administrator Bootstrap

To maintain strict security:
- Public account registration (`/register`) **always** assigns the `user` (Citizen) role.
- Public users cannot elevate their own permissions through client requests.
- The initial Administrator must be bootstrapped via the Supabase SQL Editor.

### Step-by-Step Admin Setup:
1. Start your local application (`npm run dev`).
2. Navigate to `http://localhost:3000/register` and create an account with your desired admin email (e.g. `hasib2994@gmail.com`).
3. Return to the **Supabase Dashboard** ➔ **SQL Editor**.
4. Open `supabase/promote_admin.sql` or run the snippet below with your registered email:
   ```sql
   DO $$
   DECLARE
     target_email TEXT := 'hasib2994@gmail.com'; -- Replace with your registered email
     matching_profile_id UUID;
   BEGIN
     SELECT id INTO matching_profile_id
     FROM public.profiles
     WHERE email = target_email;

     IF matching_profile_id IS NULL THEN
       RAISE EXCEPTION 'User "%" not found. Register via the web app before running this script.', target_email;
     END IF;

     UPDATE public.profiles
     SET role = 'admin', updated_at = NOW()
     WHERE id = matching_profile_id;

     RAISE NOTICE 'SUCCESS: User "%" promoted to admin.', target_email;
   END $$;
   ```
5. Click **Run**.
6. Return to `http://localhost:3000/login` and sign in. You will be redirected immediately to the **Admin Console** (`/admin`).
7. From the **Staff & Permissions** tab in the Admin Console, you can now designate other accounts as Operation Officers or Token Operators and assign them to specific service counters.

---

## 9. Running the Application

### Development Mode
```bash
npm run dev
```
Open `http://localhost:3000` in your browser. The app runs with hot module reloading and type checking.

### Type-Checking & Linting
```bash
npm run lint
```
Executes `tsc --noEmit` to verify type safety across all components and API calls.

### Production Build
```bash
npm run build
npm run start
```
Compiles and starts the optimized production server on `http://localhost:3000`.

---

## 10. Deployment Guide

### Deploying to Vercel
1. Push your code to GitHub, GitLab, or Bitbucket.
2. Log in to [Vercel](https://vercel.com) and click **Add New ➔ Project**.
3. Import your repository. Vercel will automatically detect **Next.js**.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon API Key
   - `NEXT_PUBLIC_APP_URL`: Your production domain (e.g. `https://your-domain.vercel.app`)
5. Click **Deploy**. Your system is live with full server-side rendering and edge optimizations.

---

## 11. Troubleshooting & FAQ

### Q: Why do I see "Supabase Configuration Required" when loading the app?
**A**: The application detected that `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing or contain placeholder values. Add your real Supabase credentials to `.env.local` and restart the development server.

### Q: Why can't an officer skip a no-show token immediately?
**A**: By design, the system enforces a strict 120-second no-show waiting period. The skip button remains disabled and displays the remaining countdown in seconds. The database trigger will reject any attempt to skip before 120 seconds have elapsed since the ticket was called.

### Q: Can an officer skip a ticket after clicking "Start Processing"?
**A**: No. Once a ticket moves to `working`, the applicant has physically arrived and processing has commenced. A no-show skip is legally invalid at that point. The officer must either complete the ticket as `successful` or document a formal reason to mark it as `rejected`.

### Q: How do I assign an officer to a specific counter station?
**A**: Log in with an `admin` account, go to **Admin Console (`/admin`)** ➔ **Staff & Permissions**, change the user's role to `Operation Officer`, and choose their counter from the **Assigned Counter** dropdown.

---

## License

This project is licensed under the Apache-2.0 License. See the LICENSE file for details.
