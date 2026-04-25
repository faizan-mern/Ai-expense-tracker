# Frontend

React frontend for the AI Expense Tracker.

## Run

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Build

```bash
npm run build
```

Output is generated in `dist/`. Preview it with:

```bash
npm run preview
```

## Environment

Copy `.env.example` to `.env`.

For local development, no extra values are required. Vite proxies `/api` calls to `http://localhost:5000`.

If you want to use a remote backend, set:

```env
VITE_API_BASE_URL=https://your-backend-url.com
```
