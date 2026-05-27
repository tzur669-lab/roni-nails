# Roni Nails — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel (Next.js 16)                      │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │  Public UI   │   │  Admin UI    │   │   Shared Layer     │  │
│  │  /book       │   │  /admin/*    │   │  AppShell, Navbar  │  │
│  │  /clinic     │   │  dashboard   │   │  PhoneInput        │  │
│  │  /my-appts   │   │  services    │   └────────────────────┘  │
│  │  /login      │   │  availability│                            │
│  └──────┬───────┘   │  clients     │                            │
│         │           │  payment     │                            │
│         │           └──────┬───────┘                            │
│         │                  │                                     │
│  ┌──────▼──────────────────▼───────┐                            │
│  │           State / Logic          │                            │
│  │  useAuth (hook)                  │                            │
│  │  useBookingStore (Zustand)       │                            │
│  │  booking-logic.ts (pure fn)      │                            │
│  │  whatsapp.ts + google-calendar.ts│                            │
│  │  hebrew-calendar.ts              │                            │
│  └──────────────┬──────────────────┘                            │
│                 │                                                 │
│  ┌──────────────▼──────────────────┐                            │
│  │         Firestore Layer          │                            │
│  │  lib/firestore/                  │                            │
│  │    users.ts  services.ts         │                            │
│  │    appointments.ts  settings.ts  │                            │
│  └──────────────┬──────────────────┘                            │
└─────────────────┼───────────────────────────────────────────────┘
                  │
       ┌──────────▼──────────┐
       │   Firebase (Google)  │
       │   Auth               │
       │   Firestore          │
       │   Storage            │
       └─────────────────────┘
```

---

## Modules & Responsibilities

### `src/app/` — Pages (Next.js App Router)

| Route | Who | Notes |
|-------|-----|-------|
| `/` | All | Landing page with CTA to /book |
| `/book` | All | 4-step booking wizard |
| `/login` | Unauthenticated | Google + Email sign-in |
| `/clinic` | All | Address, hours, gallery, WhatsApp link |
| `/my-appointments` | Logged-in clients | View + cancel own appointments |
| `/admin` | Admin only | Dashboard: today's schedule + pending approvals |
| `/admin/appointments` | Admin | Full appointment list with filters |
| `/admin/services` | Admin | CRUD for service catalog |
| `/admin/availability` | Admin | Recurring and one-time availability rules |
| `/admin/clients` | Admin | Client list + notes |
| `/admin/clinic` | Admin | Edit clinic info |
| `/admin/payment` | Admin | Bit/Paybox QR settings |

`/admin/layout.tsx` — guards all `/admin/*` routes; redirects non-admins.

---

### `src/lib/` — Business Logic & Integrations

| File | Role |
|------|------|
| `firebase.ts` | Init Firebase app, export `auth`, `db`, `storage`, `ADMIN_UID` |
| `booking-logic.ts` | `generateTimeSlots()` — pure function, no Firebase calls |
| `whatsapp.ts` | Builds `wa.me` URL for appointment approval messages |
| `google-calendar.ts` | Builds Google Calendar "add event" URL embedded in WhatsApp messages |
| `hebrew-calendar.ts` | Formats dates in Hebrew using `@hebcal/core` |
| `firestore/users.ts` | CRUD for `users` collection |
| `firestore/services.ts` | CRUD + ordering for `services` collection |
| `firestore/appointments.ts` | Create, read, status updates, overlap check |
| `firestore/settings.ts` | Read/write availability rules, blocked times, clinic/payment settings |

---

### `src/hooks/`

| Hook | Returns |
|------|---------|
| `useAuth` | `user`, `appUser`, `loading`, `isAdmin`, `needsPhone`, auth methods |

`isAdmin` is true if `appUser.role === "admin"` OR `user.uid === ADMIN_UID`.  
`needsPhone` is true when user is logged in but hasn't verified phone yet.

---

### `src/store/`

| Store | State |
|-------|-------|
| `useBookingStore` | `selectedService`, `selectedDate`, `selectedStartTime`, `selectedEndTime`, `guestInfo`, `step` (1–4) |

Step transitions are encoded in setters: `setService` → step 2, `setTimeSlot` → step 3.

---

### `src/components/`

```
shared/
  AppShell.tsx      — Page wrapper (max-width, padding, RTL direction)
  Navbar.tsx        — Bottom nav on mobile, top nav on desktop
  PhoneInput.tsx    — Israeli phone number input with validation

booking/
  ServiceCard.tsx       — Single service tile (step 1)
  TimeSlotPicker.tsx    — Grid of available slots (step 2)
  GuestForm.tsx         — Name + phone form for unauthenticated users (step 3)
  BookingConfirmation.tsx — Success screen (step 4)
```

---

## Firestore Collections

```
users/          {uid}   → AppUser
services/       {id}    → Service (ordered by `order` field)
appointments/   {id}    → Appointment
availabilityRules/{id}  → AvailabilityRule (recurring | one_time)
blockedTimes/   {id}    → BlockedTime
clinicSettings/ "main"  → ClinicSettings
paymentSettings/"main"  → PaymentSettings
clientNotes/    {id}    → ClientNote
```

---

## Coupling Map

| Coupled | Reason | Risk if changed |
|---------|--------|-----------------|
| `ADMIN_UID` env var ↔ `useAuth` + Firestore rules | Admin is identified by hardcoded UID | Change UID in env without updating Firestore `users` doc role → partial admin access |
| `booking-logic.ts` ↔ `book/page.tsx` | Page feeds rules/blocked/appointments to pure fn | Changing slot interval in logic without updating UI expectations breaks slot display |
| `appointments.status` enum ↔ `admin/page.tsx` STATUS_LABELS | UI color map hardcoded to status strings | Adding a new status without updating STATUS_LABELS causes unstyled badge |
| WhatsApp link ↔ `clinicSettings.address` | Address is embedded in the approval message | If `clinicSettings` doc doesn't exist, approval message has no address |
| `firestore.rules isAdmin()` ↔ `users/{uid}.role` | Rules do a live doc read | If user doc is missing, admin writes will be denied even with correct UID |

---

## Intentionally Isolated

- `booking-logic.ts` — no Firebase imports, pure function. Keep it that way.
- `whatsapp.ts` / `google-calendar.ts` / `hebrew-calendar.ts` — no Firebase, no React. Pure URL builders.
- Firestore layer (`lib/firestore/*.ts`) — no React, no Zustand. Plain async functions.
