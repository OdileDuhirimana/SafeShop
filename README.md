# SafeShop

Full-stack e-commerce demo with React, Node/Express, MongoDB, Redis, and a Python FastAPI AI service.

## Services
- frontend: Vite + React + Redux + Tailwind (port 5173)
- backend: Express API + Socket.IO (port 5000)
- ai: FastAPI for recommendations and fraud scoring (port 8000)
- mongo: MongoDB (port 27017)
- redis: Redis (port 6379)

## Quick Start (Docker)
1. Copy env example for backend and adjust if needed:
   cp backend/.env.example backend/.env
2. Build and start:
   docker compose build
   docker compose up -d
3. Open:
   Frontend: http://localhost:5173
   Backend health: http://localhost:5000/api/health
   AI health: http://localhost:8000/health

## Test Flow
- Register or login via /login
- Browse products and add to cart
- Go to cart and proceed to checkout
- Checkout will simulate payment unless STRIPE_SECRET is set
- Open Chat to send messages via WebSocket

## Environment (Backend)
- PORT=5000
- MONGO_URI=mongodb://mongo:27017/safeshop
- JWT_SECRET=change_this_dev_secret
- CLIENT_URL=http://localhost:5173
- REDIS_URL=redis://redis:6379
- AI_URL=http://ai:8000
- STRIPE_SECRET= (optional, test mode key)
# SafeShop
