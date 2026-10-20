# Deploying Smart Family Client to Vercel

## 1. Prerequisite

Deploy (or at least finalize the URL of) the server first — see the server repo's `docs/DEPLOYMENT.md`. You need the final API base URL, e.g. `https://smart-family-server.onrender.com`.

## 2. Vercel project

1. Push this repo to GitHub.
2. **Vercel → Add New Project → Import** the `Smart-Family-Client` repo. Vercel auto-detects Next.js; keep the default build command (`next build`) and output.
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = the Render API URL (required).
   - `NEXT_PUBLIC_LIVEKIT_URL` = `wss://...` LiveKit endpoint (only if calling is configured).
   - No secrets here — everything the client needs is public by design; sessions are HttpOnly cookies issued by the server.
4. Deploy.

## 3. Close the loop on the server

In Render → server service → Environment, set:

- `FRONTEND_URL` = `https://YOUR-CLIENT.vercel.app`
- `CORS_ORIGINS` = `https://YOUR-CLIENT.vercel.app`

Redeploy the server so CORS picks the client up. Without this, browsers will refuse cross-origin API/socket calls.

## 4. Verify (honest checklist)

Load the deployed client and walk through:

1. Landing page renders, "Sign up" works → account created (this proves Mongo connectivity end-to-end).
2. Create family → invitation link → second browser/account accepts → both members visible in Family Space.
3. Create a task assigned to the other member → assignee receives a live notification.
4. Chat: send a message → it appears in the other browser without refresh (proves Socket.IO + CORS + cookies).
5. Assistant: send a prompt.
   - With `GEMINI_API_KEY` set on the server → real proposal card appears; Confirm executes for real.
   - Without the key → the UI must show the honest `503 AI_NOT_CONFIGURED` message. That is correct behavior, not a bug.
6. Calls: only meaningful after `LIVEKIT_*` server vars; otherwise expect the honest `CALLING_NOT_CONFIGURED` message.

Any failure to reach the API from the browser is almost always a CORS/`NEXT_PUBLIC_API_URL` mismatch — check those first.

## Notes

- Vercel runs `middleware.ts` at the edge; it only checks for the presence of the `sf_token` cookie — actual verification always happens server-side on each API call.
- Node.js version: Vercel defaults (20.x) satisfy Next 15 requirements; nothing extra is needed.
- Socket.IO runs over the standard websocket upgrade path to your Render URL — no additional Vercel config required.
