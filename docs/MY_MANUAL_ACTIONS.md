# My Manual Actions — Smart Family Client

The complete setup/deploy checklist lives in the backend repo:
**Smart-Family-Server/docs/MY_MANUAL_ACTIONS.md** — open that file and follow it top to bottom.

Only the frontend-specific facts are repeated here.

## Frontend environment variables (the only ones the client uses)

| Variable | Required | Secret? | Value |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ (local + production) | No | Local: `http://localhost:4000/api` · Production: `https://YOUR-SERVICE.onrender.com/api` |
| `NEXT_PUBLIC_LIVEKIT_URL` | optional | No | Your LiveKit `wss://...` URL |

Everything else (database, AI, calls, Google keys) lives **only on the server** — the client never holds secrets.

## Local dev

1. Copy `.env.example` → `.env.local`, keep `NEXT_PUBLIC_API_URL=http://localhost:4000/api` while the backend runs locally.
2. `npm run dev` → http://localhost:3000

## Production (Vercel)

Steps 25–27 of the master checklist: import this repo in Vercel, add `NEXT_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com/api`, deploy, then make sure the server's `CORS_ORIGINS`/`FRONTEND_URL` include the final Vercel URL (step 28).
