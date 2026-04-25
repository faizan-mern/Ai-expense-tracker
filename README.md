# AI Expense Tracker with Smart Alerts

Full-stack web application for daily expense tracking, budget management, smart alerts, and AI-based expense entry from natural language.

This project is prepared as a company assignment submission.

## Goal

Users can:
- Track daily expenses
- Manage monthly and category budgets
- Receive spending alerts
- Add expenses using AI text input (example: "I spent 500 on food today")

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Recharts, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Authentication | JWT, bcrypt |
| Database | PostgreSQL |
| AI Layer | LangChain, LangGraph, OpenRouter API |

## Core Features Implemented

- Authentication: register, login, JWT-protected routes
- Expense management: add, edit, delete, list, date/category filters
- Categories: predefined defaults plus user-created custom categories
- Budget management: monthly and category budget limits with usage tracking
- Alerts: near budget limit, budget exceeded, unusual expense
- AI assistant flow: text input -> parse with AI -> create_expense tool -> saved to DB
- AI settings: per-user API key, model selection, editable system prompt

## Project Structure

```text
ai-expense-tracker/
  backend/
    config/          # Environment loader
    controllers/     # Route handlers
    middleware/      # Auth middleware
    routes/          # API routes
    scripts/         # DB utility scripts
    services/        # Business logic and AI pipeline
      ai/            # LangGraph graph, LangChain agent, tools
    sql/             # Schema and seed SQL files
    db/              # PostgreSQL pool
    server.js        # Backend entry point
  frontend/
    src/
      api/           # API client and endpoint calls
      components/    # Shared UI components
      context/       # Auth context
      pages/         # App pages
      routes/        # Route guards
      utils/         # Formatters/helpers
```

## Prerequisites

- Node.js 20+
- PostgreSQL (local or cloud)
- OpenRouter API key (only needed for AI features)

## Quick Start

### 1. Clone

```bash
git clone <repo-url>
cd ai-expense-tracker
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

Update `backend/.env`:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=any_long_random_string_at_least_32_chars
FRONTEND_URL=http://localhost:5173
AI_API_KEY=optional_openrouter_key
AI_MODEL=openai/gpt-4o-mini
AI_BASE_URL=https://openrouter.ai/api/v1
```

Run DB setup and backend:

```bash
npm run db:schema
npm run db:seed
npm start
```

Backend URL: `http://localhost:5000`

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

### 4. Use the app

Register a user, then test:
- Expense CRUD
- Budgets and alerts
- AI assistant text-to-expense

## Database Setup Guide

Detailed SQL setup is in:
- `backend/sql/schema.sql`
- `backend/sql/seed.sql`
- `backend/sql/README.md`

Useful commands from `backend/`:

```bash
npm run db:schema
npm run db:seed
npm run db:check
```

## Environment Setup Summary

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `FRONTEND_URL` | No | CORS allowed frontend URL |
| `AI_API_KEY` | No | Fallback OpenRouter API key |
| `AI_MODEL` | No | Default model |
| `AI_BASE_URL` | No | AI provider base URL |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | No | Set only when backend is not proxied by Vite |

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login user |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/categories` | Yes | List categories |
| POST | `/api/categories` | Yes | Create custom category |
| GET | `/api/expenses` | Yes | List expenses |
| POST | `/api/expenses` | Yes | Create expense |
| PUT | `/api/expenses/:id` | Yes | Update expense |
| DELETE | `/api/expenses/:id` | Yes | Delete expense |
| GET | `/api/budgets` | Yes | List budgets |
| POST | `/api/budgets` | Yes | Create/update budget |
| DELETE | `/api/budgets/:id` | Yes | Delete budget |
| GET | `/api/alerts` | Yes | List alerts |
| PATCH | `/api/alerts/read-all` | Yes | Mark all alerts read |
| PATCH | `/api/alerts/:id/read` | Yes | Mark one alert read |
| GET | `/api/ai/settings` | Yes | Get AI settings |
| POST | `/api/ai/settings` | Yes | Save AI settings |
| GET | `/api/ai/models` | Yes | Get model list |
| POST | `/api/ai/parse-expense` | Yes | Parse text and create expense |
| GET | `/api/health` | No | Health check |

## Deliverables Checklist

- Source code: included in this repository
- Database setup guide: `backend/sql/README.md`
- Environment setup guide: this `README.md`
- README: this file
- Demo video (5-10 minutes, Urdu): record running app and cover core features + AI flow

## Demo Video Script (Suggested)

1. Project intro and stack
2. Registration and login
3. Expense add/edit/delete/filter
4. Category and budget setup
5. Alerts behavior
6. AI expense parsing with natural language
7. Quick code walkthrough and run steps

## Security Notes

- Never commit real `.env` files
- `.env.example` files are safe to share
- Users/reviewers should insert their own DB/API credentials locally
