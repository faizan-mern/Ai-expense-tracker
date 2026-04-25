# SQL

PostgreSQL schema and seed files for the AI Expense Tracker.

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Creates all tables, indexes, and constraints |
| `seed.sql` | Inserts the 9 default expense categories |

## Run

```bash
# From the backend/ directory:
npm run db:schema
npm run db:seed
```

Or run manually against your database:

```bash
psql $DATABASE_URL -f sql/schema.sql
psql $DATABASE_URL -f sql/seed.sql
```

## Tables

- `users` — registered accounts
- `categories` — default and custom expense categories
- `expenses` — expense records
- `budgets` — monthly and category-level budget limits
- `alerts` — auto-generated spending alerts
- `ai_settings` — per-user AI configuration (key, model, system prompt)
