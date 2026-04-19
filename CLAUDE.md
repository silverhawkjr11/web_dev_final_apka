# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Apka Travel Routes — a full-stack travel route planning app (Web Platform Dev, Final 2026). Users authenticate, then plan cycling/trekking routes with interactive maps, real-time weather, and AI-generated suggestions.

**Stack:** Next.js 14 (TypeScript) frontend on port 3000, Express.js backend on port 9000, MongoDB via Mongoose.

## Commands

```bash
# Install everything
npm run install-all

# Development (runs server + client concurrently)
npm run dev

# Run individually
npm run server    # Express on :9000
npm run client    # Next.js on :3000

# Build & production
npm run build     # Build Next.js client
npm start         # Start both in production

# Lint (from client/)
cd client && npm run lint

# Health check
curl http://localhost:9000/api/health
```

## Environment Setup

Two `.env` files are required before running:

**`server/.env`** — `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `OPENAI_API_KEY`, `WEATHER_API_KEY`, `UNSPLASH_API_KEY`

**`client/.env.local`** — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLIENT_URL`, `JWT_SECRET` (same as server), `NEXT_PUBLIC_OPENAI_API_KEY`, `NEXT_PUBLIC_WEATHER_API_KEY`, `NEXT_PUBLIC_UNSPLASH_API_KEY`, plus optional map defaults.

Run `node setup.js` for interactive guided setup.

## Architecture

### Backend (`server/server.js`)
Monolithic Express app — all routes, Mongoose schemas, and middleware in one file (~426 lines).

- **Auth routes** (`/api/auth/*`): register, login, refresh token, verify. Uses bcryptjs (12 rounds) + per-user salt, JWT access tokens (15 min) + refresh tokens (1 day).
- **Route routes** (`/api/routes/*`): CRUD for saved travel routes, all protected by JWT middleware.
- Rate limiting on auth endpoints (10 req/15 min), Helmet for security headers.

### Frontend (`client/`)
Next.js App Router with two main page flows:

1. **Auth flow**: `/login`, `/register` → store JWT in cookies → redirect to `/planning`
2. **Core flow**: `/planning` (885 lines) → geocode city via Nominatim → generate route → OSRM realistic routing → fetch weather → show on map → save to DB → `/history` to review

**Key files:**
- `components/AuthProvider.tsx` — React context for auth state; Axios interceptor auto-refreshes tokens every 14 min before expiry.
- `utils/api.ts` — Axios client instance + all API call functions.
- `middleware.ts` — Next.js edge middleware protecting `/planning`, `/history`, `/profile` and redirecting authenticated users away from `/login`, `/register`.
- `next.config.js` — Rewrites `/api/server/*` → `http://localhost:9000/api/*`.

### Data Flow for Route Planning
1. User fills `RouteForm` (city, country, trip type, duration)
2. Nominatim geocodes city → lat/lng
3. LLM generates route waypoints (OpenAI, called client-side via `NEXT_PUBLIC_OPENAI_API_KEY`)
4. OSRM produces realistic road/trail geometry between waypoints
5. OpenWeatherMap fetches 3-day forecast; Unsplash fetches country hero image
6. `RouteMap` (Leaflet + react-leaflet) displays result
7. User approves → `POST /api/routes` saves `routeData` (coordinates, dailySegments, totalDistance, description, countryImage) to MongoDB

### MongoDB Schemas
- **User**: `username` (unique), `email` (unique), `password` (hashed), `salt`, `createdAt`
- **Route**: `userId` (ref User), `routeName`, `country`, `city`, `tripType` (cycling|trekking), `duration`, `routeData` (nested), `weatherData`, `approved`, `createdAt`

## Path Alias
`@/*` maps to `client/` root (configured in `tsconfig.json`).
