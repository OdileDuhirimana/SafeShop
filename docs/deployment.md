# Deployment Guide (Render + Vercel)

## Services

- Backend API on Render (`backend/`)
- AI service on Render (`ai/`)
- Frontend on Vercel (`frontend/`)

`render.yaml` defines `safeshop-api` and `safeshop-ai`.

## Render Variables

### safeshop-api

Required:
- `MONGO_URI`
- `CLIENT_URL` (your Vercel URL)
- `API_PUBLIC_URL` (Render API URL, e.g. `https://safeshop-api.onrender.com`)
- `AI_URL` (AI service URL, e.g. `https://safeshop-ai.onrender.com`)
- `AES_KEY` (base64 32-byte key)

Optional:
- `STRIPE_SECRET` (only for real Stripe mode)
- `TAX_RATE`, `BASE_CURRENCY`

Auto-generated:
- `JWT_SECRET` from `generateValue: true`

### safeshop-ai

Required:
- `CORS_ALLOW_ORIGINS` (comma-separated frontend origins)

## Vercel Variables (`frontend/`)

Required:
- `VITE_API_URL` (Render API URL without `/api`)
- `VITE_WS_URL` (same host as API URL for Socket.IO)
- `VITE_AI_URL` (Render AI URL)

## How To Get Values

- `MONGO_URI`: create a MongoDB Atlas cluster and copy the connection string
- `CLIENT_URL`: from Vercel production domain
- `API_PUBLIC_URL`: from Render service public URL
- `AI_URL`: from Render AI service public URL
- `AES_KEY`: run `openssl rand -base64 32`
- `STRIPE_SECRET`: from Stripe Dashboard > Developers > API keys
