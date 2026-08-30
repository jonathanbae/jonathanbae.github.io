import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ROLE_LABELS } from '../lib/roles';

export default function Home() {
  const { role } = useAuth();
  return (
    <div className="stack">
      <div className="card">
        <h2>New request</h2>
        <p className="muted">Submit receipts for reimbursement. You can add several at once.</p>
        <Link className="button" to="/new">Start a request</Link>
      </div>
      <div className="card">
        <h2>View existing</h2>
        <p className="muted">Look up requests you already submitted using your email.</p>
        <Link className="button secondary" to="/view">Find my requests</Link>
      </div>
      {role === 'admin' && (
        <div className="card">
          <h2>Finance queue</h2>
          <p className="muted">Review requests, fill the form, mark them paid.</p>
          <Link className="button secondary" to="/admin">Open queue</Link>
        </div>
      )}
      <p className="muted small">Signed in as {role ? ROLE_LABELS[role] : 'unknown role'}.</p>
    </div>
  );
}
