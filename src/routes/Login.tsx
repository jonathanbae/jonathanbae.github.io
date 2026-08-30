import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ROLE_EMAILS, ROLE_LABELS, type Role } from '../lib/roles';

const EXPLAIN: Record<string, string> = {
  invalid_credentials: 'Wrong password for this role (or the account email does not match).',
  email_not_confirmed: 'That account exists but is not confirmed — re-create it with "Auto Confirm User" checked.',
  user_not_found: 'No account exists for this role yet.',
  over_request_rate_limit: 'Too many attempts. Wait a minute and try again.',
  signup_disabled: 'Signups are disabled — this account has to be created in the Supabase dashboard.',
};

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState<Role>('user');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(role, password);
      nav('/', { replace: true });
    } catch (err) {
      // There are only three known accounts, so naming the actual failure costs
      // no enumeration safety and saves a lot of guessing.
      const e = err as { code?: string; message?: string };
      console.error('sign-in failed', e);
      setError(EXPLAIN[e.code ?? ''] ?? e.message ?? 'Sign-in failed.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card login" onSubmit={submit}>
        <h1>Chara Reimbursement</h1>
        <p className="muted">Sign in to submit or review a reimbursement request.</p>

        <label>
          I am
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            autoFocus
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="error">{error}</p>}
        <p className="muted small">Signing in as <code>{ROLE_EMAILS[role]}</code></p>
        <button disabled={busy || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
