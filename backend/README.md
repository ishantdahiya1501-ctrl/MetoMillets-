# Me to Millets – Auth Backend

Production-ready Node.js + Express auth API using MongoDB + Mongoose.

## Endpoints

- `POST /api/auth/register` – create user
- `POST /api/auth/login` – login, sets HTTP-only cookie
- `GET /api/auth/me` – returns current user
- `POST /api/auth/logout` – clears cookie

## Why HTTP-only cookies (token storage)

This backend stores the JWT in an **HTTP-only cookie** so it cannot be read by JavaScript (mitigates token theft via XSS). Frontend requests must use `fetch(..., { credentials: 'include' })`.

If you deploy frontend + API on different origins (Netlify + Render/Fly/Vercel), configure:
- `CORS_ORIGIN` to the Netlify site URL
- `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true`

## Local development

1. Create `.env` from `.env.example`
2. Install deps:
   - `npm install`
3. Run:
   - `npm run dev`

Health check: `GET /health`
