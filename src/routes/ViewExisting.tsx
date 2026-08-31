import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PAGE_SIZE, listRequestsByEmail, type SavedRequest } from '../lib/api';
import Pagination from '../components/Pagination.tsx';

const money = (n: number) => `$${n.toFixed(2)}`;
const totalOf = (r: SavedRequest) => r.line_items.reduce((s, i) => s + Number(i.amount), 0);

export default function ViewExisting() {
  const [params, setParams] = useSearchParams();
  const justSubmitted = params.get('submitted') === '1';
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [rows, setRows] = useState<SavedRequest[] | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function search(value: string, p = 0) {
    if (!value.includes('@')) return;
    setBusy(true); setError(null);
    try {
      const res = await listRequestsByEmail(value, p);
      setRows(res.rows);
      setCount(res.total);
      setPage(p);
    } catch {
      setError('Could not load your requests. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  // Deep-linked from a fresh submission, or revisited with ?email=
  useEffect(() => {
    const e = params.get('email');
    if (e) search(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stack">
      {justSubmitted && (
        <div className="card notice">
          <strong>Request submitted. Thank you!</strong>
          <p className="muted">
            The finance team will be in touch if they have any questions. You can come back to
            this page with the same email any time to check on it or make changes, up until
            they start reviewing it.
          </p>
        </div>
      )}

      <form
        className="card stack-sm"
        onSubmit={(e) => { e.preventDefault(); setParams({ email }); search(email, 0); }}
      >
        <h2>Find my requests</h2>
        <label>
          Your email
          <input type="email" value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button disabled={busy || !email.includes('@')}>{busy ? 'Looking…' : 'Look up'}</button>
        {error && <p className="error">{error}</p>}
      </form>

      {rows && rows.length === 0 && (
        <div className="card">
          <p className="muted">No requests found for that email.</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="card scroll">
          <table className="list">
            <thead>
              <tr>
                <th>Submitted</th><th>Paid to</th><th>Receipts</th>
                <th className="num">Total</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Submitted">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td data-label="Paid to">{r.payee_name}</td>
                  <td data-label="Receipts" className="num">{r.line_items.length}</td>
                  <td data-label="Total" className="num">{money(totalOf(r))}</td>
                  <td data-label="Status"><span className={`pill ${r.status}`}>{r.status}</span></td>
                  <td data-label=""><Link to={`/request/${r.id}`}>{r.status === 'requested' ? 'Edit' : 'View'}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={count}
            onPage={(p) => search(email, p)} busy={busy} />
        </div>
      )}
    </div>
  );
}
