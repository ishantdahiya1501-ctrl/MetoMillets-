# Deploying Real Accounts (Frontend + Backend)

This repo is a static frontend (HTML/CSS/JS) plus a separate Node/Express backend in `backend/`.

## 1) Database (MongoDB Atlas)

- Create a MongoDB Atlas cluster
- Create a database user
- Copy the connection string and put it in `MONGODB_URI`

The users collection is created automatically. Schema is in `backend/src/models/User.js`:
- `id` (Mongo ObjectId)
- `name`
- `email` (unique + indexed)
- `passwordHash`
- `createdAt`

## 2) Backend deploy (Render/Fly/Vercel)

### Environment variables
Set these in your backend host:
- `MONGODB_URI` – Atlas connection string
- `JWT_SECRET` – long random secret
- `JWT_EXPIRES_IN` – e.g. `7d`
- `CORS_ORIGIN` – your Netlify site URL (comma-separated allowed list)
- `NODE_ENV=production`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none`

Optional:
- `AUTH_COOKIE_NAME=mtm_auth`
- `COOKIE_DOMAIN=.metomillets.me` (only if you need cookies across subdomains)

### Start command
- Install: `npm install`
- Start: `npm start`

Health check:
- `GET /health`

Auth endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Data endpoints (DB-backed):
- `GET /api/wishlist`
- `POST /api/wishlist`
- `DELETE /api/wishlist/:productId`
- `GET /api/cart`
- `PUT /api/cart`
- `DELETE /api/cart/:productId`
- `GET /api/reviews?productId=...`
- `GET /api/reviews/all`
- `POST /api/reviews`
- `DELETE /api/reviews/:productId`
- `POST /api/orders`
- `GET /api/orders/mine`
- `POST /api/referrals/create` - create or return a referral code tied to a device (expects { deviceId })
- `POST /api/referrals/validate` - validate promo code availability (expects { code })

### Vercel (serverless) option
You can deploy the backend on Vercel as serverless functions:

- Project Root Directory: `backend`
- Add file `backend/api/index.js` (already added) that wraps the Express app via `serverless-http`.
- Ensure env vars are set in Vercel Project → Settings → Environment Variables:
  - `NODE_ENV=production`
  - `MONGODB_URI` (Atlas URI)
  - `JWT_SECRET` (long random)
  - `JWT_EXPIRES_IN=7d`
  - `CORS_ORIGIN=https://YOUR-FRONTEND-DOMAIN`
  - `COOKIE_SECURE=true`
  - `COOKIE_SAMESITE=lax` (recommended when frontend proxies `/api/*`)

Your Vercel backend will expose endpoints under `/api/*` (e.g., `/api/auth/login`).
Use a second Vercel project for the frontend and add a `vercel.json` rewrite in the frontend project if you want to proxy `/api/*` to your backend project domain.

## 3) Frontend integration (no UI changes)

The frontend now calls the real auth APIs from:
- `pages/login-register.html`
- `js/account-v2.js`

Token storage choice:
- The JWT is stored in an **HTTP-only cookie** (set by the backend).
- Frontend uses `fetch(..., { credentials: 'include' })` via `js/auth-client.js`.

### Connecting frontend to backend
You have two safe options:

**Option A (recommended on Netlify): proxy `/api/*` via Netlify redirects**
- Edit the root [_redirects](_redirects) file and replace `https://YOUR-BACKEND-HOST-HERE` with your backend base URL.
- Netlify will proxy `https://YOUR-SITE.netlify.app/api/*` to your backend.
- This avoids CORS complexity and keeps cookies first-party (best for persistent sessions).

**Option B: set the API base URL at runtime**
- Set `window.MTM_API_BASE_URL = 'https://YOUR-BACKEND'` before auth runs, OR set it once in the browser:
  - `localStorage.setItem('MTM_API_BASE_URL', 'https://YOUR-BACKEND')`

## 4) Production notes

- If frontend and backend are on different origins, cookies require:
  - `COOKIE_SAMESITE=none`
  - `COOKIE_SECURE=true`
  - HTTPS for both sites
- Ensure `CORS_ORIGIN` includes your exact frontend origin (e.g. `https://your-site.netlify.app`).
