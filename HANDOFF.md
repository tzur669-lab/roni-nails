# Roni Nails — Handoff (Start Here)

**GitHub:** https://github.com/tzura669-lab/roni-nails  
**Deployed:** Vercel (auto-deploy on push to main)  
**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Firebase (Auth + Firestore + Storage)

---

## What This Is

A nail salon booking app for "רוני ניילס". Clients book appointments; Roni (admin) approves/rejects them. The app is in Hebrew (RTL), mobile-first.

---

## Core Architecture

```
Client Browser
  └─ Next.js App Router (src/app/)
       ├─ Public pages:  /, /book, /clinic, /login, /my-appointments
       └─ Admin pages:   /admin/* (layout.tsx enforces admin-only)

State / Logic
  ├─ useAuth (hook)       — Firebase Auth state + AppUser from Firestore
  ├─ useBookingStore      — Zustand: 4-step booking wizard state
  └─ booking-logic.ts     — Pure function: generates available time slots

Data Layer (Firestore)
  ├─ users/               — AppUser (role, phone, phoneVerified)
  ├─ services/            — Service catalog (public read)
  ├─ appointments/        — All bookings (guests can create without auth)
  ├─ availabilityRules/   — Recurring + one-time open hours
  ├─ blockedTimes/        — Explicit closed periods
  ├─ clinicSettings/      — Name, address, hours, gallery, WhatsApp/Instagram
  ├─ paymentSettings/     — Bit/Paybox QR (auth-only read)
  └─ clientNotes/         — Admin-only notes per client
```

---

## Non-Obvious Rules — Do Not Break

| Rule | Where | Why |
|------|--------|-----|
| Admin = `ADMIN_UID` env var OR `role === "admin"` in Firestore | `useAuth.ts`, `firebase.ts` | Dual check: belt-and-suspenders. Never remove the env-var check. |
| Guests can create appointments without login | `firestore.rules`, `book/page.tsx` | Intentional. `clientId = "guest"` for unauth users. |
| `isAdmin()` in Firestore rules reads the `users` doc | `firestore.rules:5–8` | Means the `users` doc must exist and have `role` set before admin writes work. |
| Slot interval is 5 min | `booking-logic.ts:4` | `SLOT_INTERVAL_MINUTES = 5`. Duration of service ≠ slot interval. |
| `one_time` availability rule overrides `recurring` | `booking-logic.ts` | `oneTimeRule ?? recurringRule` — one-time wins. |
| Appointments `allow list: if true` | `firestore.rules` | Required so guests and clients can see available slots. Single-doc `get` is auth-only. |
| No client-side overlap check | `book/page.tsx` | `checkOverlap()` was removed — it required a Firestore composite index that was missing. Admin handles duplicates manually. |
| WhatsApp approval is opened with `window.open` | `admin/page.tsx` | Not automated — admin must click. A wa.me link opens in a new tab. |
| PaymentSettings requires auth to read | `firestore.rules` | Unlike other settings, payment details are not public. |
| Phone `auth/provider-already-linked` bypass | `PhoneInput.tsx` | Only auto-verifies if Firebase Auth's linked phone **exactly matches** what was entered. Otherwise shows an error. |

---

## Data Flow: Booking a Slot

```
User selects service
  → Zustand step 1 → 2
User selects date (monthly calendar, up to 60 days ahead)
  → Fetch availabilityRules + blockedTimes + all appointments
  → generateTimeSlots() computes available slots (5-min intervals)
User picks slot
  → Zustand step 2 → 3
User confirms (or fills GuestForm if not logged in)
  → createAppointment() → Firestore (status: "pending")
Admin approves
  → updateAppointmentStatus("approved")
  → window.open(buildWhatsAppApprovalLink()) — sends wa.me message with Google Calendar link
```

---

## Key Files

| File | Responsibility |
|------|---------------|
| `src/types/index.ts` | All shared TypeScript types |
| `src/lib/firebase.ts` | Firebase init + `ADMIN_UID` export |
| `src/lib/booking-logic.ts` | Slot generation algorithm (pure, testable) — 5-min intervals |
| `src/lib/whatsapp.ts` | Builds wa.me approval link with Hebrew date |
| `src/hooks/useAuth.ts` | Auth state, `isAdmin`, `needsPhone` flags |
| `src/store/bookingStore.ts` | Zustand booking wizard (steps 1–4) |
| `src/app/book/page.tsx` | Booking flow — monthly calendar date picker, 5-min time slots |
| `src/app/admin/layout.tsx` | Admin route guard + sidebar/bottom nav |
| `src/app/admin/page.tsx` | Admin dashboard — today's schedule + pending approvals |
| `src/components/shared/PhoneInput.tsx` | Phone verification modal (Firebase phone auth + reCAPTCHA) |
| `src/components/booking/TimeSlotPicker.tsx` | Time slot grid (4 columns, 5-min slots) |
| `firestore.rules` | Security rules — deploy via Firebase Console → Firestore → Rules |

---

## Environment Variables Required

```env
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_ADMIN_UID   ← Roni's Firebase UID
```

Set in Vercel Dashboard → Settings → Environment Variables for production.

---

## Appointment Status Lifecycle

```
pending → approved   (admin approves, WhatsApp sent)
        → rejected   (admin rejects)
        → cancelled  (client cancels)
pending/approved → change_requested  (client requests reschedule)
```

---

## Deploying Firestore Rules

Rules are **not** auto-deployed by Vercel. After editing `firestore.rules`, deploy manually:

**Option A — Firebase Console (no setup needed):**
1. [console.firebase.google.com](https://console.firebase.google.com) → project → Firestore → Rules tab
2. Paste contents of `firestore.rules` → Publish

**Option B — CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # once per project
firebase deploy --only firestore:rules
```

---

## Further Reading

- [ARCHITECTURE.md](ARCHITECTURE.md) — full module diagram and coupling map
- [SETUP.md](SETUP.md) — Firebase project setup and first-run steps
- [README.md](README.md) — docs index

---

## Changelog

### 2026-05-27
- **Fix (critical):** Firestore `appointments` rules changed from `allow read` to `allow get` (auth-only) + `allow list: if true`. Previously, no one except admins could load available time slots or submit bookings.
- **Fix:** Removed `checkOverlap()` client-side call in `book/page.tsx` — it required a composite Firestore index that wasn't created, causing all booking submissions to fail with a generic error.
- **Fix:** `PhoneInput.tsx` — removed bypass that auto-verified phone on `auth/provider-already-linked` without SMS. Now only auto-verifies if the entered number matches the already-linked Firebase Auth phone.
- **Fix:** `admin/page.tsx` — status badge in "לוח היום" now updates immediately after admin approves a pending appointment (was showing stale "ממתין" status until page refresh).
- **Feature:** Booking date picker replaced with a monthly calendar grid (weeks in rows, prev/next month navigation, 60-day window).
- **Change:** Slot interval changed from 10 min to 5 min (`booking-logic.ts`). Removed the :00/:10 vs :05/:15 offset toggle from `TimeSlotPicker`.
- **Fix (minor):** `admin/layout.tsx` — "הסלון" nav item icon changed from 🏠 (duplicate of "לוח ראשי") to 💅.

### 2026-05-27 (session 3)
- **Fix:** Booking page now allows selecting today. Past time slots for today are filtered out after generation (not shown to clients). `minDate` changed from `tomorrow` to `today`.
- **Fix (critical):** `"completed"` appointments now move to a dedicated `appointmentsCompleted` Firestore collection (instead of staying in `appointmentsApproved`). `markPastAppointmentsAsCompleted()` uses a batch set+delete to atomically move documents. `getTodayAppointments` updated to include `COLL_COMPLETED`. Firestore rules updated.
- **Feature:** Admin can manually add an appointment at `/admin/appointments/new`. Choose a registered client (searchable list) or enter any name+phone, pick a service, date, and time — creates directly as "approved". Link: "+ הוסף תור" button in ניהול תורים.
- **Change:** `my-appointments` page no longer calls `markPastAppointmentsAsCompleted` (was causing permission issues for non-admin users). Instead, past approved appointments are visually remapped to "completed" on the client side based on `endTime`.

### 2026-05-27 (session 2)
- **Feature:** Email is now optional on the signup form. If left blank, Firebase Auth uses a generated placeholder email (`noemail_<timestamp>@placeholder.com`) and Firestore stores `""` for the email field. Users who sign up without email can log in via Google.
- **Feature:** New `"completed"` appointment status. Any approved appointment whose `endTime` has passed is automatically marked as `"completed"` (sky-blue "בוצע ✓" badge) when the admin dashboard or "My Appointments" page loads. The transition runs client-side via `markPastAppointmentsAsCompleted()` in `src/lib/firestore/appointments.ts`. Firestore rules updated to allow authenticated owners to mark their own past appointments as completed.
- **Feature:** Availability management — new "הוסף לכלל ימות השבוע" checkbox. When checked and recurring type is selected, one click creates 7 rules (Sun–Sat) at once with the same open/close times.

---

_Last updated: 2026-05-27_
