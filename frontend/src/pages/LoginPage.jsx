import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const[error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <p className="auth-copy">
          Access your expenses, budgets, alerts, and AI tools.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                value={form.email}
                autoComplete="email"
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-wrapper input-wrapper--with-action">
              <Lock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                autoComplete="current-password"
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="input-action-button"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {error && (
            <div className="form-error">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
            <span className="inline-flex items-center gap-2">
              {isSubmitting ? <Loader2 className="spin" size={16} /> : null}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </span>
          </Button>
        </form>

        <p className="auth-switch">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
