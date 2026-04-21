# AI Expense Tracker

This repository is for a company hiring task: build an AI Expense Tracker web application with smart alerts.

The goal is not only to finish the app, but to build it in a way that is easy to learn, explain, and continue in a new chat or with a new AI assistant.

## Current Status

Phase 1 is in progress.

What already exists:
- A basic Express backend
- PostgreSQL connection setup file
- Environment variable support
- Project planning and handoff documentation

What is not built yet:
- Database schema
- Authentication APIs
- Expense, budget, and alert APIs
- AI integration with LangChain/LangGraph
- React frontend

## Project Docs

Read these files in order:

1. [`docs/PROJECT_CONTEXT.md`](E:/Cyberify/ai-expense-tracker/docs/PROJECT_CONTEXT.md)
2. [`docs/IMPLEMENTATION_PLAN.md`](E:/Cyberify/ai-expense-tracker/docs/IMPLEMENTATION_PLAN.md)
3. [`docs/DATABASE_SETUP.md`](E:/Cyberify/ai-expense-tracker/docs/DATABASE_SETUP.md)
4. [`docs/AI_HANDOFF.md`](E:/Cyberify/ai-expense-tracker/docs/AI_HANDOFF.md)

## Backend Quick Start

```powershell
cd E:\Cyberify\ai-expense-tracker\backend
copy .env.example .env
npm install
npm run dev
```

Useful endpoints:

- `GET /`
- `GET /api/health`

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
