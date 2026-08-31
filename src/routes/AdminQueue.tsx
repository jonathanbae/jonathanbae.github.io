import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { bulkSetStatus, listAllRequests, sheetLinksFor } from '../lib/admin.ts';
import { PAGE_SIZE, type SavedRequest, type Status } from '../lib/api.ts';
import { groupForSheet, toTSV } from '../lib/sheet.ts';
import Pagination from '../components/Pagination.tsx';
import { TRACKERS, trackerFor, trackerYears } from '../lib/trackers.ts';

const FILTERS: (Status | 'all')[] = ['requested', 'reviewed', 'paid', 'rejected', 'all'];
const total = (r: SavedRequest) => r.line_items.reduce((s, i) => s + Number(i.amount), 0);
const needsCategory = (r: SavedRequest) => r.line_items.some((i) => !i.code);

export default function AdminQueue() {
  const [filter, setFilter] = useState<Status | 'all'>('requested');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<SavedRequest[]>([]);
  const [count, setCount] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  async function load(f: Status | 'all', p: number) {
    setBusy(true);
    try {
      const res = await listAllRequests(f, p);
      setRows(res.rows);
      setCount(res.total);
      setPicked(new Set());
    } catch {
      setError('Could not load the queue.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(filter, page); }, [filter, page]);

  const selected = useMemo(() => rows.filter((r) => picked.has(r.id)), [rows, picked]);
  const allOnPage = rows.length > 0 && rows.every((r) => picked.has(r.id));

  function toggle(id: string) {
    setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  const toggleAll = () => setPicked(allOnPage ? new Set() : new Set(rows.map((r) => r.id)));

  async function act(label: string, fn: () => Promise<unknown>) {
    setBusy(true); setError(null); setNote(null);
    try { await fn(); setNote(label); await load(filter, page); }
    catch (e) { setError(e instanceof Error ? e.message : 'That did not work.'); setBusy(false); }
  }

  async function copyRows() {
    setBusy(true);
    const out = [];
    for (const r of selected) out.push(...groupForSheet(r, await sheetLinksFor(r)));
    out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setBusy(false);
    try {
      await navigator.clipboard.writeText(toTSV(out));
      setNote(`${out.length} row${out.length === 1 ? '' : 's'} copied — paste into the ${tracker?.year ?? ''} tracker.`);
    } catch {
      setError('The browser blocked clipboard access. Open a single request and copy from there.');
    }
  }

  const ids = selected.map((r) => r.id);
  const tracker = trackerFor();

  return (
    <div className="stack">
      <div className="card">
        <h2>Finance queue</h2>
        <div className="tabs">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={`tab ${filter === f ? 'on' : ''}`}
              onClick={() => { setFilter(f); setPage(0); }}>{f}</button>
          ))}
        </div>
      </div>

      {error && <div className="card errors">{error}</div>}
      {note && <div className="card notice">{note}</div>}

      <div className="card">
        <h2>Ministry expense trackers</h2>
        <p className="muted">Copied rows are pasted into the sheet for the year the money was spent.</p>
        <ul className="trackers">
          {trackerYears().map((y) => (
            <li key={y}>
              <a href={TRACKERS[y]} target="_blank" rel="noopener noreferrer">{y} ministry expenses</a>
              {y === tracker?.year && <span className="pill ok">current</span>}
            </li>
          ))}
        </ul>
      </div>

      {busy && rows.length === 0 ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <div className="card"><p className="muted">Nothing here.</p></div>
      ) : (
        <>
          <div className="card scroll">
            <table className="list">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={allOnPage} onChange={toggleAll}
                      aria-label="Select all on this page" />
                  </th>
                  <th>Submitted</th><th>Paid to</th><th>From</th>
                  <th className="num">Items</th><th className="num">Total</th><th>Status</th><th />
                </tr>
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
                      {needsCategory(r) && <span className="pill warn">needs category</span>}
                      {r.pastor_signed_at && <span className="pill ok">signed</span>}
                    </td>
                    <td data-label="From" className="dim">{r.submitter_email}</td>
                    <td data-label="Items" className="num">{r.line_items.length}</td>
                    <td data-label="Total" className="num">${total(r).toFixed(2)}</td>
                    <td data-label="Status"><span className={`pill ${r.status}`}>{r.status}</span></td>
                    <td data-label=""><Link to={`/admin/${r.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={count} onPage={setPage} busy={busy} />
          </div>

          <div className="card bulkbar">
            <span className="muted">{selected.length} selected</span>
            <div className="actions">
              <button type="button" className="button secondary"
                disabled={busy || !ids.length} onClick={copyRows}>Copy sheet rows</button>
              {tracker && (
                <a className="button secondary" href={tracker.url} target="_blank" rel="noopener noreferrer">
                  Open {tracker.year} tracker
                </a>
              )}
              <button type="button" className="button secondary" disabled={busy || !ids.length}
                onClick={() => act(`Marked ${ids.length} paid.`, () => bulkSetStatus(ids, 'paid'))}>
                Mark paid
              </button>
              <button type="button" className="button danger" disabled={busy || !ids.length}
                onClick={() => {
                  const reason = window.prompt(`Why are these ${ids.length} being turned down?`);
                  if (reason === null) return;
                  act(`Rejected ${ids.length}.`, () => bulkSetStatus(ids, 'rejected', reason));
                }}>
                Reject
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
