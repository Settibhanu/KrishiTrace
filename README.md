# Krishi-Trace AI

Blockchain-backed supply chain transparency + Multilingual Voice AI for Indian farmers.

## Project Structure

```
├── backend/          Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── models/   Mongoose schemas
│   │   ├── routes/   REST API endpoints
│   │   ├── utils/    Blockchain, voice parser, route optimizer
│   │   └── server.js Entry point
│   └── .env          Environment config
└── frontend/         React + Vite SPA
    └── src/
        ├── pages/    All page components
        ├── components/ Layout, shared UI
        ├── context/  Auth context
        ├── i18n/     Translations (EN, HI, KN, TE, TA)
        └── api/      Axios instance
```

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

## Setup & Run

### 1. Backend

```bash
# Copy env and edit as needed
cp backend/.env.example backend/.env

# Install dependencies (already done)
npm install --prefix backend

# Seed fair price configs
node backend/src/seed.js

# Start server
npm start --prefix backend
# or for dev with auto-reload:
npx nodemon backend/src/server.js
```

Backend runs on http://localhost:5000

### 2. Frontend

```bash
npm run dev --prefix frontend
```

Frontend runs on http://localhost:5173

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register farmer/operator/fpo_admin |
| POST | /api/auth/login | Login |
| POST | /api/harvest/voice | Parse voice transcript |
| POST | /api/harvest | Create harvest record |
| GET | /api/ledger | Paginated blockchain ledger |
| GET | /api/qr/:recordId | Public QR verification (no auth) |
| POST | /api/gis/shipments | Create shipment with route |
| PATCH | /api/gis/shipments/:id/location | Update GPS location |
| POST | /api/iot/readings | Ingest sensor reading |
| POST | /api/iot/simulate/:id | Generate demo sensor data |
| GET | /api/reports/summary | FPO dashboard summary |
| GET | /api/reports/trends | Payout trends over time |

## Features

- **Voice Harvest Logging** — Web Speech API in Hindi, Kannada, Telugu, Tamil, English
- **Blockchain Ledger** — Simulated Ethereum tx hashes, fair price enforcement
- **QR Scan-to-Verify** — Public `/verify/:recordId` page, no login required
- **GIS Tracker** — Leaflet map with planned/actual routes, deviation alerts
- **IoT Monitor** — Temperature/humidity charts, spoilage alerts
- **Multilingual UI** — Full i18n in 5 languages, saved to user profile
- **FPO Reports** — Compliance charts, violation lists, CSV export

## Demo Accounts

Register via `/register` with role:
- `farmer` — can log harvests via voice
- `operator` — can create shipments, view GIS
- `fpo_admin` — can view reports and set fair prices
