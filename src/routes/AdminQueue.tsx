import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAllRequests, sheetLinksFor } from '../lib/admin.ts';
import type { SavedRequest, Status } from '../lib/api.ts';
import { groupForSheet, toTSV } from '../lib/sheet.ts';

const FILTERS: (Status | 'all')[] = ['requested', 'reviewed', 'paid', 'all'];
const total = (r: SavedRequest) => r.line_items.reduce((s, i) => s + Number(i.amount), 0);
const needsCategory = (r: SavedRequest) => r.line_items.some((i) => !i.code);

export default function AdminQueue() {
  const [filter, setFilter] = useState<Status | 'all'>('requested');
  const [rows, setRows] = useState<SavedRequest[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    setBusy(true);
    listAllRequests(filter)
      .then((r) => { setRows(r); setPicked(new Set()); })
      .catch(() => setError('Could not load the queue.'))
      .finally(() => setBusy(false));
  }, [filter]);

  const selected = useMemo(() => rows.filter((r) => picked.has(r.id)), [rows, picked]);

  function toggle(id: string) {
    setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function copyRows() {
    setBusy(true);
    const rowsOut = [];
    for (const r of selected) rowsOut.push(...groupForSheet(r, await sheetLinksFor(r)));
    rowsOut.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setBusy(false);
    try {
      await navigator.clipboard.writeText(toTSV(rowsOut));
      setCopied(`${rowsOut.length} row${rowsOut.length === 1 ? '' : 's'} copied — paste into the tracker.`);
    } catch {
      setError('Clipboard blocked by the browser. Open a request and copy from there.');
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Finance queue</h2>
        <div className="tabs">
          {FILTERS.map((f) => (
            <button key={f} type="button"
              className={`tab ${filter === f ? 'on' : ''}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {error && <div className="card errors">{error}</div>}
      {copied && <div className="card notice">{copied}</div>}

      {busy ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <div className="card"><p className="muted">Nothing here.</p></div>
      ) : (
        <>
          <div className="card scroll">
            <table className="list">
              <thead>
                <tr>
                  <th />
                  <th>Submitted</th><th>Paid to</th><th>From</th>
                  <th className="num">Items</th><th className="num">Total</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)}
                        aria-label={`Select request for ${r.payee_name}`} />
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      {r.payee_name}
                      {needsCategory(r) && <span className="pill warn">needs category</span>}
                    </td>
                    <td className="dim">{r.submitter_email}</td>
                    <td className="num">{r.line_items.length}</td>
                    <td className="num">${total(r).toFixed(2)}</td>
                    <td><span className={`pill ${r.status}`}>{r.status}</span></td>
                    <td><Link to={`/admin/${r.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card submit-bar">
            <div>
              <span className="muted">{selected.length} selected</span>
              <span className="hint">Receipt and Expense columns get shareable links that do not expire.</span>
            </div>
            <button type="button" disabled={selected.length === 0} onClick={copyRows}>
              Copy sheet rows
            </button>
          </div>
        </>
      )}
    </div>
  );
}
