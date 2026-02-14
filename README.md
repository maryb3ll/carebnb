# CareBnb Marketplace

A full-stack care marketplace that connects **patients** with **care providers** and lets **providers** find **open care requests**. Built with Next.js (App Router), Supabase, and PostGIS for location-based matching.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the app](#running-the-app)
- [Project structure](#project-structure)
- [Pages & routes](#pages--routes)
- [API reference](#api-reference)
- [Environment variables](#environment-variables)
- [Supabase configuration](#supabase-configuration)
- [Deployment](#deployment)

---

## Features

### Patient side

- **Find care** — Search by service, date/time, and location (or “Use my location”). See a ranked list of providers (distance, rating, visits). Filter by minimum rating. “Available for similar dates” re-runs search with a shifted date.
- **Provider profile** — Click a provider card to view full profile (photo, role, specialties, price, next available). Book from profile or from search.
- **Book** — Creates a booking and sends you to the intake form (name, phone, address/notes, consent). Then a confirmation page with booking details.
- **My bookings** — List of your bookings with provider, service, date, status. Cancel pending/confirmed bookings. Open any booking to see details or cancel.
- **Request care** — Post an open care request (service, description, preferred time, location). Providers see it in “Find open requests.”

### Provider side

- **Register as provider** — On the provider dashboard, if you’re logged in but not yet a provider, you can register (name, role, services, location). Your account is linked via `user_id`.
- **My jobs** — List of bookings where you’re the provider. **Confirm** pending bookings and **Mark complete** confirmed ones. Links to the booking confirmation page.
- **Find open requests** — Search by service and location to see nearby open care requests (jobs board). Use “Use my location” or default (SF area).

### Auth & account

- **Sign up / Log in** — Email and password (Supabase Auth). Session is used for bookings (patient id) and provider profile (provider id).
- **Forgot password** — “Forgot password?” on login → enter email → receive reset link → **Reset password** page to set a new password.
- **Header** — When logged in: email and “Sign out.” When logged out: “Log in” and “Sign up.”

### Data & backend

- **Patient linkage** — First time you book or post a care request while logged in, a `patients` row is created and linked to your auth user (`user_id`). Future bookings use that patient.
- **Provider linkage** — Register as provider to create a `providers` row with your `user_id`. “My jobs” and provider actions (Confirm / Mark complete) use that provider.

---

## Tech stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend     | Next.js API routes                  |
| Database    | Supabase (PostgreSQL)               |
| Geo         | PostGIS (geography points, distance queries)     |
| Auth        | Supabase Auth (email/password)      |

---

## Prerequisites

- **Node.js** 18+
- **npm** (or yarn/pnpm)
- **Supabase account** — [supabase.com](https://supabase.com)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd CareBnB
npm install
```

### 2. Create a Supabase project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Note:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **Anon public key** (Project Settings → API)

### 3. Database: extensions and schema

In the Supabase **SQL Editor**:

1. **Enable extensions** (if not already):

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

2. **Run the main schema**  
   Open `supabase/schema.sql`, copy its entire contents, paste into the SQL Editor, and run it. This creates:
   - Tables: `providers`, `patients`, `care_requests`, `bookings`
   - Indexes (GIST on location, GIN on services, etc.)
   - RPCs: `match_providers`, `match_requests`
   - Seed data (demo patient, ~12 providers near SF, 3 open care requests)

3. **Run the auth/intake migration**  
   Open `supabase/migrations/001_auth_and_intake.sql`, copy and run it. This adds:
   - `user_id` on `patients` and `providers` (FK to `auth.users`)
   - Intake fields on `bookings`: `patient_name`, `patient_phone`, `address_notes`, `consent`

4. **Verify**  
   In **Table Editor**, confirm the four tables exist. Under **Database → Functions**, confirm `match_providers` and `match_requests`.

Detailed checklist: **supabase/README.md**.

### 4. Environment variables

Copy the example env file and set your Supabase keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
```

---

## Running the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Build for production:** `npm run build`
- **Start production server:** `npm run start`
- **Lint:** `npm run lint`

---

## Project structure

```
CareBnB/
├── app/
│   ├── layout.tsx              # Root layout, header nav
│   ├── page.tsx                # Home: Find care (search + provider cards)
│   ├── globals.css
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── request-care/            # Post a care request
│   ├── bookings/               # My bookings (patient)
│   ├── intake/                  # Intake form after Book
│   ├── booking/confirmed/       # Booking confirmation + actions
│   ├── provider/
│   │   ├── page.tsx             # Provider dashboard (register, my jobs, find requests)
│   │   └── [id]/page.tsx        # Provider profile
│   └── api/
│       ├── me/                  # GET current user + patientId/providerId
│       ├── providers/
│       │   ├── match/           # GET match providers by service/location
│       │   ├── [id]/            # GET one provider
│       │   └── register/        # POST register as provider
│       ├── requests/match/      # GET match open care requests
│       ├── bookings/            # GET (patient or provider list), POST create
│       ├── bookings/[id]/       # GET one, PATCH (intake/cancel/confirm/complete)
│       └── care-requests/       # POST create care request
├── components/
│   └── HeaderAuth.tsx           # Log in / Sign up / Sign out in header
├── lib/
│   ├── supabase.ts             # Browser + server Supabase client
│   └── auth.ts                 # getPatientIdForUser, getProviderIdForUser, getAuthUser
├── supabase/
│   ├── schema.sql              # Tables, indexes, RPCs, seed
│   ├── migrations/
│   │   └── 001_auth_and_intake.sql
│   └── README.md               # SQL run checklist
├── .env.example
├── .env.local                  # Not committed
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## Pages & routes

| Path | Description |
|------|-------------|
| `/` | Find care: search bar (where, time, type of care, doctor name), provider cards, filter by rating, “Available for similar dates” |
| `/login` | Log in (email/password). “Forgot password?” → `/forgot-password` |
| `/signup` | Sign up (email/password) |
| `/forgot-password` | Enter email → send reset link |
| `/reset-password` | Set new password (landing from email link) |
| `/request-care` | Post open care request (service, description, time, location) |
| `/bookings` | My bookings (patient): list, cancel, link to confirmation |
| `/intake` | Intake form when `bookingId` in URL (name, phone, address, consent). “Save & confirm” → confirmation |
| `/booking/confirmed?id=...` | Booking details. Patient: Cancel. Provider: Confirm / Mark complete |
| `/provider` | Provider dashboard: register as provider, My jobs, Find open requests |
| `/provider/[id]` | Provider profile: photo, name, role, rating, price, specialties, “Book this provider” |

---

## API reference

All APIs that need auth expect: `Authorization: Bearer <access_token>` (from `supabase.auth.getSession()`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/me` | Optional | Returns `{ user, patientId, providerId }` for current user |
| GET | `/api/providers/match` | No | Query: `service`, `lat`, `lng`, `when?`, `radius?`, `limit?`. Returns providers within radius, sorted by distance/rating |
| GET | `/api/providers/[id]` | No | One provider by id |
| POST | `/api/providers/register` | Yes | Body: `name`, `role`, `services[]`, `lat?`, `lng?`. Creates provider linked to user |
| GET | `/api/requests/match` | No | Query: `service`, `lat`, `lng`, `radius?`, `limit?`. Returns open care requests |
| GET | `/api/bookings` | Optional | Query: `for=provider` optional. Returns bookings for current patient or provider |
| POST | `/api/bookings` | Optional | Body: `providerId`, `service`, `when`, `careRequestId?`. Creates booking (uses demo patient if not logged in) |
| GET | `/api/bookings/[id]` | No | One booking with provider details (for confirmation page) |
| PATCH | `/api/bookings/[id]` | Yes | **Patient:** `patient_name`, `patient_phone`, `address_notes`, `consent`, `status: "cancelled"`. **Provider:** `status: "confirmed"` or `"completed"` |
| POST | `/api/care-requests` | Optional | Body: `service`, `description?`, `requested_start`, `lat`, `lng`. Creates open care request |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |

Use `.env.local` for local development. Do not commit secrets.

---

## Supabase configuration

### Redirect URLs (for password reset)

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL:** e.g. `http://localhost:3000` (dev) or your production URL
- **Redirect URLs:** Add:
  - `http://localhost:3000/reset-password`
  - Your production URL + `/reset-password` when you deploy

### Email (optional)

- **Authentication → Providers → Email:** You can disable “Confirm email” so signups work without verification for demos.
- Password reset emails are sent by Supabase when you call `resetPasswordForEmail`.

---

## Deployment

1. **Build:** `npm run build`
2. **Deploy** to Vercel (or another host). Set **Environment Variables** in the project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In Supabase, add your production URL (e.g. `https://your-app.vercel.app`) to **Redirect URLs** and set **Site URL** if needed.

---

## License

Private / unlicensed unless otherwise specified.
