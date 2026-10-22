# Smart Family — Client

**AI-Powered Family Care, Communication & Safety Platform** — Next.js frontend.

> One Family. One Platform. Smarter Care with AI.
> Stay connected, organize care, get reminders, and help keep your loved ones safe — all in one place.

This is the companion frontend to [Smart-Family-Server](https://github.com/shahed-hassan-fz-rabbi/Smart-Family-Server) (Express + MongoDB + Socket.IO, deploys to Render).

## Features (implemented in this UI)

- **Dashboard** — live greeting, quick actions, open tasks, upcoming events/reminders, recent family updates and notifications.
- **AI assistant** — full conversation UI (history, suggestions, composer) in English, Bangla or Banglish. Proposals are rendered as review cards with **Confirm / Edit / Cancel**; execution and results come from the backend — the UI can never fake success. When the server has no Gemini key it surfaces the server's honest `AI_NOT_CONFIGURED` state.
- **Family chats** — separate from the AI: DM & group conversations with Socket.IO live delivery, typing indicator, unread badges, read marking, and reconnect-safe dedupe.
- **Calls** — start audio/video calls with a LiveKit room (mic controls, participants view); unconfigured servers show an honest `CALLING_NOT_CONFIGURED` error rather than a fake room.
- **Tasks / Calendar / Reminders** — complete CRUD with member-picker assignment, participant-chip events, month grid + agenda with conflict detection banner, recurring reminders.
- **Family space** — members with roles, owner-only role editing, remove/leave, invitations with copyable expiring links and token acceptance.
- **Safety** — emergency contacts (admin-managed), explicit confirm-before-SOS flow with the honest disclaimer, opt-in location toggle.
- **Updates / Notifications / Profile / Settings / Help** — updates feed with pinning; notification center with read/read-all and live socket refresh; profile (name, language, timezone); settings (AI consent, calendar/update sharing, location opt-in, notification prefs, account deactivation); help with FAQ.
- **Marketing site** — landing, features, how-it-works, about, privacy, terms — all written without fabricated stats or testimonials.

## Tech

Next.js (App Router) · React 19 · TypeScript strict · Tailwind (custom `sf-*` design tokens, deep-orange palette) · Lucide icons · React Hook Form + Zod · Socket.IO client · `@livekit/components-react` · Inter font.

## Getting started

```bash
npm install
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL
npm run dev                   # http://localhost:3000
```

`.env.local` variables:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Server base URL, e.g. `http://localhost:4000` or your Render URL (no trailing slash) |
| `NEXT_PUBLIC_LIVEKIT_URL` | optional | `wss://...` LiveKit endpoint; when unset the server-issued call URL is used |

## Deployment (Vercel)

1. Push this repo to GitHub, then **Vercel → Add New Project** and import it (framework auto-detected: Next.js).
2. Add `NEXT_PUBLIC_API_URL` (production Render URL) — and `NEXT_PUBLIC_LIVEKIT_URL` if calling is configured.
3. Deploy. Route protection (cookie-presence middleware) runs on Vercel's edge.
4. On the **server** side, make sure `CORS_ORIGINS`/`FRONTEND_URL` include the final Vercel URL, or browsers will block API calls.

Anything that requires secrets (Mongo, Gemini, LiveKit keys) lives only on the server — this client holds no secrets and every `NEXT_PUBLIC_*` value is public by design.

## Project structure

```
src/
  app/
    (marketing)/      landing, features, how-it-works, about, privacy, terms
    (auth pages)/     login, signup, forgot-password, reset-password
    (app)/            dashboard, family(+invitations), assistant, chats(+[id]),
                      calls(+[id]), tasks, calendar, reminders, notifications,
                      updates, safety, health, profile, settings, help
  components/         ui.tsx primitives, PageHeader, BrandMark, auth shell, marketing nav
  context/            AuthContext (session refresh, family, logout)
  hooks/              useFamilyData
  lib/                api client (typed, credentials: include), socket manager, format helpers, types
middleware.ts         cookie-presence route protection
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build (verified passing: 29 routes)
- `npm run typecheck` — `tsc --noEmit` (verified clean)

## Honest status

Everything in the feature list above is real client code wired to real server endpoints; however, end-to-end behavior depends on the server environment:

- **MongoDB Atlas configured** → accounts, families, tasks, chats, calendar, reminders, notifications all work for real.
- **`GEMINI_API_KEY` set** → AI assistant produces and executes real proposals; without it the UI honestly reports the server is not configured.
- **LiveKit configured** → calls connect in a real room; without it the call pages show the server's `503 CALLING_NOT_CONFIGURED` message.
- **Email/push delivery** is not implemented anywhere in the platform — the UI never claims it.

## Official logo

public/smartfamily logo.png is the official Smart Family brand asset (untouched). It is used in the
marketer navbar/footer, auth screens, family dashboard topbar and sidebar, loading states, the
Platform Admin sidebar, and as the browser favicon (via metadata.icons). The PNG has transparent
corners, so it reads clearly in both Dark and Light mode without any container.
