# SQL

PostgreSQL schema and seed files for the AI Expense Tracker.

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Creates all tables, indexes, and constraints |
| `seed.sql` | Inserts the default expense categories |

## Run

```bash
# From backend/
npm run db:schema
npm run db:seed
```

Or run manually:

```bash
psql $DATABASE_URL -f sql/schema.sql
psql $DATABASE_URL -f sql/seed.sql
```

## Tables

- `users`: registered accounts
- `categories`: default and custom expense categories
- `expenses`: expense records
- `budgets`: monthly and category budget limits
- `alerts`: auto-generated spending alerts
- `ai_settings`: per-user AI configuration (key, model, prompt)
