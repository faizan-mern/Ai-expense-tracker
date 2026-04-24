import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { setNavigator } from "./api/client";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const BudgetsPage = lazy(() => import("./pages/BudgetsPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const AiAssistantPage = lazy(() => import("./pages/AiAssistantPage"));
const AiSettingsPage = lazy(() => import("./pages/AiSettingsPage"));

function RouteFallback() {
  return (
    <section className="page">
      <div className="panel">
        <p className="loading-pulse">Loading page...</p>
      </div>
    </section>
  );
}

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigator(navigate);

    return () => {
      setNavigator(null);
    };
  }, [navigate]);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="ai" element={<AiAssistantPage />} />
          <Route path="settings" element={<AiSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
