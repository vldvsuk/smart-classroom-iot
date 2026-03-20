# Smart Classroom IoT

Monitoring stack that simulates environmental sensors (temperature, humidity, CO₂), streams them to a Node.js backend, and visualises the live data in a React/Vite frontend.

## Architecture
- `simulator/` — Rust CLI that periodically posts JSON sensor readings to the backend.
- `backend/` — Express server with Socket.IO; accepts simulator posts on `POST /data` and broadcasts them to web clients.
- `frontend/` — React + Vite dashboard that consumes the Socket.IO stream and renders live stats, chart, and recent table.

## Prerequisites
- Node.js 18+ (backend and frontend)
- Rust toolchain (simulator)

## Quick start
In three terminals, from the repo root:

1) Backend  
```bash
cd backend
npm install
npm start
```
Listens on `http://localhost:3000` and emits `sensor-data` events via WebSocket.

2) Simulator  
```bash
cd simulator
cargo run
```
Sends a JSON payload every ~2 seconds: `{ temperature, humidity, co2 }` to `http://localhost:3000/data`.

3) Frontend  
```bash
cd frontend
npm install
npm run dev
# open the shown URL (default http://localhost:5173)
```
Connects to the backend WebSocket and displays live metrics.

## Environment details
- CORS: backend allows origin `http://localhost:5173` (Vite default). Use `npm run dev -- --host` if you need LAN access and update CORS accordingly.
- Ports: backend 3000, frontend 5173. Adjust in `backend/index.js` and `frontend/src/App.jsx` if you change them.

## Data flow
1. Simulator generates random readings.  
2. Backend receives via HTTP, logs, and immediately broadcasts with `io.emit('sensor-data', payload)`.  
3. Frontend listens to `sensor-data`, updates KPI cards, chart, and table.

## Troubleshooting
- No live data: ensure all three processes are running; check backend console for incoming posts; confirm frontend uses the same host/port as backend (`http://localhost:3000`).
- Parse/build errors in frontend: restart Vite after edits and ensure Node 18+.  
- WebSocket blocked: verify firewall and that you open the frontend from the allowed origin.

## Project scripts
- Backend: `npm start`
- Frontend: `npm run dev`, `npm run build`
- Simulator: `cargo run`

## License
MIT
