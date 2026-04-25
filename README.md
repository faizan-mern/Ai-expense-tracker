# AI Expense Tracker

A full-stack web application for tracking daily expenses, managing budgets, and creating expense entries using natural language AI.

Built as a hiring task submission.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Recharts, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| Auth | JWT, bcrypt |
| AI | LangChain, LangGraph, OpenRouter API |

## Features

- JWT-based authentication — register, login, protected routes
- Full expense management — add, edit, delete, filter by date and category
- Category management — 9 predefined categories plus custom categories per user
- Budget management — monthly and category-level budgets with live usage tracking
- Smart alerts — automatic near_limit, budget_exceeded, and unusual_expense detection
- AI expense parser — describe a purchase in plain text, AI extracts and saves it as a structured expense entry
- Dynamic AI config — users bring their own OpenRouter API key, select from curated models, set a custom system prompt

## Project Structure

```
ai-expense-tracker/
├── backend/
│   ├── config/         # Environment loader
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth middleware
│   ├── routes/         # API route definitions
│   ├── scripts/        # DB utility scripts
│   ├── services/       # Business logic and AI pipeline
│   │   └── ai/         # LangGraph graph, LangChain agent, tools
│   ├── sql/            # Schema and seed SQL files
│   ├── db/             # PostgreSQL pool
│   └── server.js       # Entry point
├── frontend/
│   └── src/
│       ├── api/        # API client and endpoint functions
│       ├── components/ # Shared UI components (Button, Card, Modal, Toast)
│       ├── context/    # Auth context
│       ├── pages/      # All page components
│       ├── routes/     # Protected route wrapper
│       └── utils/      # Date and currency formatters
└── docs/               # Testing checklist and demo script
```

## Prerequisites

- Node.js 20 or higher
- PostgreSQL database (local or any cloud host — see Database section below)
- OpenRouter API key for AI features (free at openrouter.ai — see AI section below)

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd ai-expense-tracker
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in the required values:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=any_long_random_string_at_least_32_chars
```

Optionally add your OpenRouter API key as a fallback for all users:
```env
AI_API_KEY=sk-or-v1-...
```

Then install and initialize the database:

```bash
npm install
npm run db:schema
npm run db:seed
npm start
```

Backend runs at `http://localhost:5000`.

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 4. Open the app

Go to `http://localhost:5173`, register an account, and start tracking.

## Database

The app uses standard PostgreSQL. Any host works:

| Option | Notes |
|---|---|
| Local PostgreSQL | `postgresql://user:password@localhost:5432/dbname` |
| Neon (neon.tech) | Paste their connection string, append `?sslmode=require` |
| Supabase | Use the connection string from project settings |
| Railway | Use their provided DATABASE_URL |

Database commands:

```bash
npm run db:schema   # Creates all tables and indexes
npm run db:seed     # Inserts the 9 default expense categories
npm run db:check    # Verifies connection and lists tables
```

## AI Configuration

The app uses **OpenRouter** (openrouter.ai) as the AI provider.

- Get a free API key at openrouter.ai — no credit card required for free models
- Free models in the curated list work with a free-tier key
- Paid models (GPT-4o Mini, Claude 3.5 Haiku) require OpenRouter credits
- Users can add their own key inside the app under AI Settings
- If `AI_API_KEY` is set in `backend/.env`, it acts as the app-level fallback

> **Note:** The app is built specifically for OpenRouter. Standard OpenAI API keys will not work directly because model IDs use OpenRouter's `provider/model` format (e.g. `openai/gpt-4o-mini`).

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing — use a long random string |
| `FRONTEND_URL` | No | Frontend URL for CORS (default: `http://localhost:5173`) |
| `AI_API_KEY` | No | OpenRouter API key — app-level fallback |
| `AI_MODEL` | No | Default model (default: `openai/gpt-4o-mini`) |
| `AI_BASE_URL` | No | AI base URL (default: `https://openrouter.ai/api/v1`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | No | Backend URL if not using Vite proxy (leave blank for local dev) |

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new account |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/expenses` | Yes | List expenses with optional filters |
| POST | `/api/expenses` | Yes | Create expense |
| PUT | `/api/expenses/:id` | Yes | Update expense |
| DELETE | `/api/expenses/:id` | Yes | Delete expense |
| GET | `/api/categories` | Yes | List categories |
| POST | `/api/categories` | Yes | Create custom category |
| GET | `/api/budgets` | Yes | List budgets for a month |
| POST | `/api/budgets` | Yes | Save or update budget |
| DELETE | `/api/budgets/:id` | Yes | Delete budget |
| GET | `/api/alerts` | Yes | List alerts |
| PATCH | `/api/alerts/:id/read` | Yes | Mark alert as read |
| PATCH | `/api/alerts/read-all` | Yes | Mark all alerts as read |
| GET | `/api/ai/settings` | Yes | Get AI configuration |
| POST | `/api/ai/settings` | Yes | Save AI configuration |
| GET | `/api/ai/models` | Yes | Get available model list |
| POST | `/api/ai/parse-expense` | Yes | Parse natural language into expense |
| GET | `/api/health` | No | Health check |

## Submission Deliverables

- Source code in this repository
- Database setup guide: `backend/sql/README.md`
- Environment setup guide: this `README.md`
- Testing and demo support docs in `docs/`:
  - `TESTING_GUIDE.md`
  - `FINAL_QA_CHECKLIST.md`
  - `DEMO_SCRIPT_URDU.md`

## GitHub Publishing Plan (Private Repo Friendly)

1. Create a new GitHub repository (recommended: private).
2. Push this codebase to the repository.
3. Add evaluator/instructor GitHub accounts as collaborators with read access.
4. Keep repository private and share only the repo URL with invited reviewers.
5. Record a 5-10 minute Urdu demo video showing:
   - auth flow
   - expense CRUD and filters
   - budgets and alerts
   - AI expense parsing from natural language
6. Submit:
   - private repo link (or zip if requested)
   - demo video link/file

### Private Repo Access Notes

- Private repos are only visible to people you explicitly invite.
- Invited collaborators can clone and review code without making the repo public.
- If access is temporarily needed, add reviewers before deadline, then remove access later if desired.
