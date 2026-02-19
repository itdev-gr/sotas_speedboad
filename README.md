# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `npm run compress-videos` | Compress MP4s in `public/videos/` (requires ffmpeg) |

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

- **Public (client):** `PUBLIC_FIREBASE_*` — API key, auth domain, project ID, storage bucket, messaging sender ID, app ID. Used by the site and by the dashboard login page.
- **Server (dashboard & contact API):** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — from a Firebase service account. Used for session verification, Firestore (bookings, locations, prices, scooters, **contacts**), and login.
- **Admin-only login:** `ADMIN_EMAILS` — comma-separated list of emails that are allowed to log in to the dashboard (e.g. `admin@example.com,other@example.com`). If empty, any Firebase user can log in; if set, only these emails get access.

Do not commit `.env`.

## Dashboard and contact form

The site includes an integrated **dashboard** (admin area):

- **Routes:** `/login`, `/dashboard`, `/dashboard/inventory`, `/dashboard/prices`, `/dashboard/locations`, `/dashboard/bookings`, `/dashboard/contacts`.
- **Auth:** Login uses Firebase Auth; the server sets an HttpOnly session cookie. Only emails listed in `ADMIN_EMAILS` can log in (if that variable is set).
- **Contact form:** Submissions from the public contact page are stored in Firestore in the `contacts` collection and shown under **Dashboard → Contacts**.

## Deploy on Vercel

The project is configured for [Vercel](https://vercel.com):

- **Git:** Connect your repo at [vercel.com/new](https://vercel.com/new) and import `itdev-gr/sotas_speedboad` (or your fork). Vercel will detect Astro and use `npm run build` and `dist/`.
- **CLI:** Install [Vercel CLI](https://vercel.com/docs/cli), then run `vercel` in the project root.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
