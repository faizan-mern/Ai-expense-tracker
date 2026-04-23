# Frontend

This is the React frontend for the AI Expense Tracker hiring task.

## Run

```powershell
cd E:\Cyberify\ai-expense-tracker\frontend
copy .env.example .env
npm run dev
```

By default, Vite proxies `/api/*` requests to `http://localhost:5000`.
If you want to point the frontend to another backend URL, set:

```env
VITE_API_BASE_URL=http://localhost:5000
```
