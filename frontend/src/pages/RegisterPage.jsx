import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, Loader2, Lock, Mail, User as UserIcon } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const[form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const[isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <p className="eyebrow">Create account</p>
        <h1>Create your account</h1>
        <p className="auth-copy">
          Start with a secure workspace for expenses, budgets, alerts, and AI-assisted entry.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <div className="input-wrapper">
              <UserIcon className="input-icon" />
              <input
                type="text"
                value={form.fullName}
                autoComplete="name"
                onChange={(event) =>
                  setForm((current) => ({ ...current, fullName: event.target.value }))
                }
                required
              />
            </div>
          </label>

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
                autoComplete="new-password"
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                minLength={6}
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </span>
          </Button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
