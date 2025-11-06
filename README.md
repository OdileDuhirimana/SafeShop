# SafeShop

Full-stack e-commerce demo with React, Node/Express, MongoDB, Redis, and a Python FastAPI AI service.

## Portfolio Features
- AI Shopping Concierge: goal + budget based curated picks (`/concierge`, `POST /api/products/concierge`)
- Price Watch Alerts: create/list/trigger alerts when prices drop (`/alerts`, `/api/alerts`)
- Checkout Savings Optimizer: best discount simulation before payment (`POST /api/orders/optimize`)
- Seller Trust Score: seller reliability score using ratings/fulfillment/stock health (`GET /api/metrics/seller`, `GET /api/metrics/admin/seller-trust`)
- Inventory Forecast: seller stockout forecast and restock guidance (`GET /api/metrics/seller/forecast`)

## Extended Backend Capabilities
- Order lifecycle & tracking timeline: queue view, status transitions, cancel flow, tracking number support
- Stock reservation and rollback: checkout validates inventory and reserves stock safely
- Address book: multi-address shipping management (`/api/addresses`)
- Saved payment vault (simulated): tokenized payment methods (`/api/payment-methods`)
- Returns management: return request + approval/refund workflow (`/api/returns`)
- Product Q&A: customer questions and seller/admin answers (`/api/questions`)
- Notification center: unread/read management and event-driven notifications (`/api/notifications`)
- Search intelligence: trending searches + autocomplete suggestions (`/api/search/*`)
- Recently viewed history: personalized browsing trail (`/api/recently-viewed`)

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

## Git Hygiene
- `frontend/node_modules` has been removed from git tracking.
- For history rewrite (secrets + large files), follow `docs/portfolio-release.md`.
