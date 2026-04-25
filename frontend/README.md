# Frontend

React frontend for the AI Expense Tracker.

## Run

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`. API requests are proxied to `http://localhost:5000` by Vite automatically.

## Build

```bash
npm run build
```

Output goes to `dist/`. Preview the build with `npm run preview`.

## Environment

Copy `.env.example` to `.env`. For local development no changes are needed — Vite proxies API calls to the backend automatically.

If you need to point to a remote backend, set:

```env
VITE_API_BASE_URL=https://your-backend-url.com
```
