import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listForPastor, signRequests } from '../lib/pastor.ts';
import { PAGE_SIZE, type SavedRequest } from '../lib/api.ts';
import { getOperator, getSignature, setSignature } from '../lib/operator.ts';
import SignaturePad from '../components/SignaturePad.tsx';
import Pagination from '../components/Pagination.tsx';

const total = (r: SavedRequest) => r.line_items.reduce((s, i) => s + Number(i.amount), 0);

export default function PastorQueue() {
  const [showSigned, setShowSigned] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<SavedRequest[]>([]);
  const [count, setCount] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [signature, setSig] = useState<string | null>(getSignature());
  const [editingSig, setEditingSig] = useState(!getSignature());
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  async function load(signed: boolean, p: number) {
    setBusy(true);
    try {
      const res = await listForPastor(signed, p);
      setRows(res.rows);
      setCount(res.total);
      setPicked(new Set());
    } catch {
      setError('Could not load requests.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(showSigned, page); }, [showSigned, page]);

  const selected = useMemo(() => rows.filter((r) => picked.has(r.id)), [rows, picked]);
  const allOnPage = rows.length > 0 && rows.every((r) => picked.has(r.id));
  const toggle = (id: string) =>
    setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function approve() {
    const name = getOperator();
    if (!signature || !name) { setError('Add your signature first.'); return; }
    setBusy(true); setError(null); setNote(null);
    try {
      const n = await signRequests(selected.map((r) => r.id), name, signature);
      setNote(`Signed ${n} request${n === 1 ? '' : 's'}.`);
      await load(showSigned, page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign.');
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Approvals</h2>
        <p className="muted">
          Your signature is stamped into the Minister Signature box on the printed form.
        </p>
        <div className="tabs">
          <button type="button" className={`tab ${!showSigned ? 'on' : ''}`}
            onClick={() => { setShowSigned(false); setPage(0); }}>Awaiting me</button>
          <button type="button" className={`tab ${showSigned ? 'on' : ''}`}
            onClick={() => { setShowSigned(true); setPage(0); }}>Already signed</button>
        </div>
      </div>

      <div className="card stack-sm">
        <div className="row-head">
          <h2>My signature</h2>
          {!editingSig && (
            <button type="button" className="link" onClick={() => setEditingSig(true)}>Redraw</button>
          )}
        </div>
        {editingSig ? (
          <>
            <SignaturePad initial={signature} onChange={setSig} />
            <div className="actions">
              <button type="button" disabled={!signature}
                onClick={() => { if (signature) { setSignature(signature); setEditingSig(false); } }}>
                Save signature
              </button>
            </div>
          </>
        ) : (
          <img className="sig-preview" src={signature ?? ''} alt="Your saved signature" />
        )}
      </div>

      {error && <div className="card errors">{error}</div>}
      {note && <div className="card notice">{note}</div>}

      {busy && rows.length === 0 ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <div className="card"><p className="muted">
          {showSigned ? 'You have not signed anything yet.' : 'Nothing is waiting on you.'}
        </p></div>
      ) : (
        <>
          <div className="card scroll">
            <table className="list">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={allOnPage} aria-label="Select all on this page"
                      onChange={() => setPicked(allOnPage ? new Set() : new Set(rows.map((r) => r.id)))} />
                  </th>
                  <th>Submitted</th><th>Paid to</th>
                  <th className="num">Items</th><th className="num">Total</th><th /></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={picked.has(r.id) ? 'picked' : ''}>
                    <td data-label="">
                      <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)}
                        aria-label={`Select the request for ${r.payee_name}`} />
                    </td>
                    <td data-label="Submitted">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td data-label="Paid to">
                      {r.payee_name}
                      {r.pastor_signed_at && <span className="pill ok">signed</span>}
                    </td>
                    <td data-label="Items" className="num">{r.line_items.length}</td>
                    <td data-label="Total" className="num">${total(r).toFixed(2)}</td>
                    <td data-label=""><Link to={`/request/${r.id}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPage={setPage} busy={busy} />
          </div>

          {!showSigned && (
            <div className="card bulkbar">
              <span className="muted">{selected.length} selected</span>
              <div className="actions">
                <button type="button" disabled={busy || !selected.length || !signature}
                  onClick={approve}>Approve &amp; sign</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
