# Dashboard + Login export

This folder contains a **copy** of the Freedom Wheels dashboard and login for integration into another Astro project. Deleting this folder does not affect the main project; all original files remain in `src/`.

## Contents

- **lib/** – `auth.ts` (session cookie, verifySession), `firebase.ts` (Firebase Admin: Auth + Firestore)
- **layouts/** – `DashboardLayout.astro` (session check, redirect to `/login`, nav, logout)
- **pages/login.astro** – Login page (Firebase Auth client, calls `/api/login`)
- **pages/dashboard/** – Dashboard home, Inventory, Prices, Locations, Bookings
- **pages/api/** – `login.ts`, `logout.ts`, `me.ts`, `prices.ts`, `bookings.ts`, `locations.ts`, `scooters.ts`

## Integration into another project

1. Copy the contents of this folder into your project’s `src/` directory (merge with existing `lib/`, `layouts/`, `pages/` so that the dashboard and API routes sit alongside your existing pages).
2. Install dependencies (if not already present):
   - `astro`
   - `firebase` (client SDK, for login page)
   - `firebase-admin` (server, for API and lib)
3. Configure environment variables (see below).
4. Optionally adjust the “Site” link and logo path in `layouts/DashboardLayout.astro` and in `pages/login.astro` to point to your main site.

## Environment variables

### Server (API and dashboard layout)

- `FIREBASE_PROJECT_ID` – Firebase project ID
- `FIREBASE_CLIENT_EMAIL` – Service account client email
- `FIREBASE_PRIVATE_KEY` – Service account private key (use `\n` for newlines if stored in one line)

### Client (login page)

- `PUBLIC_FIREBASE_API_KEY` – Web API key
- `PUBLIC_FIREBASE_AUTH_DOMAIN` – Auth domain (e.g. `your-project.firebaseapp.com`)
- `PUBLIC_FIREBASE_PROJECT_ID` – Same as server project ID
- `PUBLIC_FIREBASE_APP_ID` – Web app ID

## Routes

- `/login` – Login page
- `/dashboard` – Dashboard home (redirects to `/login` if not authenticated)
- `/dashboard/inventory`, `/dashboard/prices`, `/dashboard/locations`, `/dashboard/bookings` – Dashboard sections
- `/api/login` (POST), `/api/logout` (POST), `/api/me` (GET), `/api/prices`, `/api/bookings`, `/api/locations`, `/api/scooters` – API routes used by the dashboard and login

## Firebase collections

The dashboard expects these Firestore collections: `prices`, `bookings`, `locations`, `scooters`. Structure matches the API handlers in `pages/api/`.
