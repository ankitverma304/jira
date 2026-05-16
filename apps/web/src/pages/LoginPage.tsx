import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/client";

export function LoginPage() {
  const [email, setEmail] = useState("superadmin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="eyebrow">Authentication</p>
        <h1>Login</h1>
        <p className="muted">Use any seeded role account to test permissions and navigation.</p>
        {error ? <div className="card error-card">{error}</div> : null}
        <form className="stacked-form" onSubmit={handleSubmit}>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" required />
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" required />
          <button className="button" type="submit" disabled={submitting}>
            Sign in
          </button>
        </form>
        <div className="credential-hint">
          <strong>Default password for seeded users:</strong> <code>admin123</code>
        </div>
      </div>
    </div>
  );
}
