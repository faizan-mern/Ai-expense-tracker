CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  budget_month DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT budgets_budget_month_is_first_day
    CHECK (budget_month = DATE_TRUNC('month', budget_month)::DATE)
);

CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expense_id BIGINT REFERENCES expenses(id) ON DELETE SET NULL,
  budget_id BIGINT REFERENCES budgets(id) ON DELETE SET NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('near_limit', 'budget_exceeded', 'unusual_expense')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_default_name_unique_idx
  ON categories (LOWER(name))
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_unique_idx
  ON categories (user_id, LOWER(name))
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month_category_unique_idx
  ON budgets (user_id, budget_month, category_id);

CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month_overall_unique_idx
  ON budgets (user_id, budget_month)
  WHERE category_id IS NULL;

CREATE INDEX IF NOT EXISTS expenses_user_date_idx
  ON expenses (user_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS expenses_user_category_idx
  ON expenses (user_id, category_id);

CREATE INDEX IF NOT EXISTS budgets_user_month_idx
  ON budgets (user_id, budget_month);

CREATE INDEX IF NOT EXISTS alerts_user_read_idx
  ON alerts (user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  api_key TEXT,
  model_name VARCHAR(100) NOT NULL DEFAULT 'openai/gpt-4o-mini',
  system_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);