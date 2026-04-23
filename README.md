# AI Expense Tracker

This repository is for a company hiring task: build an AI Expense Tracker web application with smart alerts.

The goal is not only to finish the app, but to build it in a way that is easy to learn, explain, and continue in a new chat 

## Current Status

The app is fully implemented — backend and frontend are both complete.

What is built:
- Express backend with PostgreSQL
- JWT authentication (register, login)
- Full expense CRUD with category filtering and date filtering
- Category management (predefined + custom)
- Monthly and category budget management with live usage tracking
- Automatic alert system (near_limit, budget_exceeded, unusual_expense)
- LangGraph + LangChain AI pipeline for natural language expense creation
- React frontend with Dashboard, Expenses, Budgets, Alerts, AI Assistant, AI Settings pages
- Dynamic AI configuration (model, API key, system prompt) per user
- PKR currency formatting

What is left for optional polish:
- Email notifications (optional feature from spec)
- Recurring expenses (optional feature from spec)

## Project Docs

Read these files in order:

1. [`docs/PROJECT_CONTEXT.md`](E:/Cyberify/ai-expense-tracker/docs/PROJECT_CONTEXT.md)
2. [`docs/IMPLEMENTATION_PLAN.md`](E:/Cyberify/ai-expense-tracker/docs/IMPLEMENTATION_PLAN.md)
3. [`docs/DATABASE_SETUP.md`](E:/Cyberify/ai-expense-tracker/docs/DATABASE_SETUP.md)
4. [`docs/SCHEMA_EXPLAINED.md`](E:/Cyberify/ai-expense-tracker/docs/SCHEMA_EXPLAINED.md)
5. [`docs/EXPENSE_SYSTEM_EXPLAINED.md`](E:/Cyberify/ai-expense-tracker/docs/EXPENSE_SYSTEM_EXPLAINED.md)
6. [`docs/AI_HANDOFF.md`](E:/Cyberify/ai-expense-tracker/docs/AI_HANDOFF.md)

## Backend Quick Start

```powershell
cd E:\Cyberify\ai-expense-tracker\backend
copy .env.example .env
npm install
npm.cmd run db:check
npm.cmd run db:schema
npm.cmd run db:seed
npm run dev
```

Useful endpoints:

- `GET /`
- `GET /api/health`
- `POST /api/ai/parse-expense`

To use the AI endpoint, add these values to `backend/.env`:

```env
AI_API_KEY=your_openrouter_api_key
AI_MODEL=openai/gpt-4o-mini
AI_BASE_URL=https://openrouter.ai/api/v1
```

`backend/.env` is local-only and should stay untracked. Use `backend/.env.example` as the safe template for the repo.

## Frontend Quick Start

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Mac/Linux:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## Planned High-Level Structure

```text
ai-expense-tracker/
  backend/
    config/
    controllers/
    db/
    middleware/
    routes/
    services/
    sql/
  docs/
  frontend/
```

## Important Task Rules

- Stay aligned with the PDF requirements
- Use PostgreSQL only
- Use JWT only for authentication
- Keep the architecture simple and beginner-friendly
- Do not introduce extra tools unless they solve a clear PDF requirement
