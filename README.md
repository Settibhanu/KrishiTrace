# Krishi-Trace AI

Blockchain-backed supply chain transparency + Multilingual Voice AI for Indian farmers.

## Project Structure

```
krishi-trace/
├── backend/                  Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── middleware/       JWT auth middleware
│   │   ├── models/           Mongoose schemas
│   │   ├── routes/           REST API endpoints
│   │   ├── utils/            Blockchain, voice parser, route optimizer
│   │   └── server.js         Entry point (also Vercel serverless handler)
│   ├── vercel.json           Vercel config for the backend project
│   └── .env.example          Environment variable template
└── frontend/                 React + Vite SPA
    ├── src/
    │   ├── pages/            All page components
    │   ├── components/       Layout, shared UI
    │   ├── context/          Auth context
    │   ├── i18n/             Translations (EN, HI, KN, TE, TA)
    │   └── api/              Axios instance
    ├── vercel.json           Vercel config for the frontend project (SPA rewrites)
    └── .env.example          Environment variable template
```

---

## Prerequisites

- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

---

## Local Development

### 1. Backend

```bash
# Copy env template and fill in your values
cp backend/.env.example backend/.env

# Install dependencies
npm install --prefix backend

# Seed fair price configs + demo users
node backend/src/seed.js

# Start dev server (auto-reload)
npm run dev:backend
# or: npx nodemon backend/src/server.js
```

Backend runs on **http://localhost:5000**

### 2. Frontend

```bash
# Copy env template (optional for local dev — proxy handles /api/* automatically)
cp frontend/.env.example frontend/.env.local

# Install dependencies
npm install --prefix frontend

# Start dev server
npm run dev:frontend
```

Frontend runs on **http://localhost:5173**  
All `/api/*` requests are proxied to `http://localhost:5000` automatically.

---

## Vercel Deployment

This is a **monorepo** with two independent Vercel projects:

| Project | Root directory | Purpose |
|---------|---------------|---------|
| `krishi-trace-api` | `backend/` | Express API as serverless functions |
| `krishi-trace-app` | `frontend/` | React SPA as static site |

### Step 1 — Deploy the Backend

1. Go to [vercel.com/new](https://vercel.com/new) → Import your GitHub repo
2. Set **Root Directory** to `backend`
3. Framework preset: **Other**
4. Add the following **Environment Variables** in the Vercel dashboard:

   | Variable | Value |
   |----------|-------|
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/krishi_trace` |
   | `JWT_SECRET` | A long random string (e.g. `openssl rand -hex 32`) |
   | `FRONTEND_URL` | *(leave blank for now — fill in after frontend is deployed)* |

5. Deploy. Note the backend URL, e.g. `https://krishi-trace-api.vercel.app`

### Step 2 — Deploy the Frontend

1. Go to [vercel.com/new](https://vercel.com/new) → Import the same repo
2. Set **Root Directory** to `frontend`
3. Framework preset: **Vite**
4. Add the following **Environment Variable**:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://krishi-trace-api.vercel.app/api` |

5. Deploy. Note the frontend URL, e.g. `https://krishi-trace-app.vercel.app`

### Step 3 — Link CORS

Go back to the **backend** Vercel project → Settings → Environment Variables and set:

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://krishi-trace-app.vercel.app` |

Redeploy the backend. CORS is now restricted to your frontend domain.

### Step 4 — Seed the Production Database

Run the seed script once against your Atlas cluster:

```bash
MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/krishi_trace" node backend/src/seed.js
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register farmer / operator / fpo_admin |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| PATCH | `/api/auth/language` | ✅ | Update preferred language |
| POST | `/api/harvest/voice` | ✅ farmer | Parse voice transcript |
| POST | `/api/harvest` | ✅ farmer | Create harvest record |
| GET | `/api/harvest` | ✅ | List harvest records |
| GET | `/api/harvest/:recordId` | — | Get single record |
| GET | `/api/ledger` | ✅ | Paginated blockchain ledger |
| GET | `/api/ledger/tx/:txHash` | — | Verify transaction |
| GET | `/api/qr/:recordId` | — | Public QR verification (no auth) |
| POST | `/api/gis/shipments` | ✅ | Create shipment with route |
| GET | `/api/gis/shipments` | ✅ | List active shipments |
| PATCH | `/api/gis/shipments/:id/location` | ✅ | Update GPS location |
| PATCH | `/api/gis/shipments/:id/deliver` | ✅ | Mark as delivered |
| POST | `/api/iot/readings` | — | Ingest sensor reading |
| GET | `/api/iot/readings/:shipmentId` | ✅ | Time-series IoT data |
| GET | `/api/iot/alerts` | ✅ | Active spoilage alerts |
| POST | `/api/iot/simulate/:id` | ✅ | Generate demo sensor data |
| GET | `/api/reports/summary` | ✅ fpo_admin/operator | FPO dashboard summary |
| GET | `/api/reports/trends` | ✅ fpo_admin/operator | Payout trends |
| GET | `/api/reports/fair-prices` | ✅ | List fair price configs |
| POST | `/api/reports/fair-prices` | ✅ fpo_admin | Set/update fair price |
| GET | `/api/market/analysis` | ✅ | Crop market analysis |
| POST | `/api/market/ask` | ✅ | Market Q&A chatbot |
| GET | `/api/health` | — | Health check |

---

## Features

- **Voice Harvest Logging** — Web Speech API in Hindi, Kannada, Telugu, Tamil, English
- **Blockchain Ledger** — Simulated Ethereum tx hashes, fair price enforcement
- **QR Scan-to-Verify** — Public `/verify/:recordId` page, no login required
- **GIS Tracker** — Leaflet map with planned/actual routes, deviation alerts
- **IoT Monitor** — Temperature/humidity charts, spoilage alerts
- **Multilingual UI** — Full i18n in 5 languages, saved to user profile
- **FPO Reports** — Compliance charts, violation lists
- **Market Advisor** — AI chatbot with crop price data, MSP info, revenue estimates

---

## Demo Accounts

Seed the database first (`node backend/src/seed.js`), then log in with:

| Role | Mobile | Password |
|------|--------|----------|
| Farmer | `9000000001` | `demo1234` |
| Operator | `9000000002` | `demo1234` |
| FPO Admin | `9000000003` | `demo1234` |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | TCP port for local dev (default: 5000) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret for signing JWTs |
| `FRONTEND_URL` | Production | Comma-separated allowed CORS origins |
| `VERCEL` | Auto | Set by Vercel — prevents `app.listen()` in serverless |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Production | Backend API base URL (e.g. `https://api.vercel.app/api`) |
