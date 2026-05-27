# Roni Nails — Docs Index

**GitHub:** https://github.com/tzura669-lab/roni-nails  
**Live:** Deployed on Vercel (auto-deploy from `main`)

---

## Start Here

| Doc | Purpose | Read when |
|-----|---------|-----------|
| [HANDOFF.md](HANDOFF.md) | Single source of truth — architecture, invariants, data flow | **Always read first** in a new session |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Module diagram, coupling map, Firestore collections | Touching any core module or adding features |
| [SETUP.md](SETUP.md) | Firebase project setup, `.env.local`, first-run admin steps | Setting up the project from scratch or on a new machine |

---

## Quick Start (local dev)

```bash
cd "Roni Nails"
npm install
# Create .env.local with Firebase config (see SETUP.md)
npm run dev
# → http://localhost:3000
```

---

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, custom CSS variables for theming
- **State:** Zustand (booking wizard), TanStack Query optional
- **Backend:** Firebase — Auth (Google + Email), Firestore, Storage
- **Deployment:** Vercel (connected to GitHub)
- **Utilities:** `@hebcal/core` (Hebrew calendar), `react-hook-form` + Zod (forms)
