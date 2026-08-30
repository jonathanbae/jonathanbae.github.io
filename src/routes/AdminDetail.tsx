import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  adminSaveRequest, buildFormPdf, generateForm, getRequest, missingForPdf, setStatus,
} from '../lib/admin.ts';
import { listCategories, signedReceiptUrl, type SavedItem, type SavedRequest } from '../lib/api.ts';
import { groupForSheet, toTSV } from '../lib/sheet.ts';
import { RECEIPT_MODE_LABELS, type Category, type ReceiptMode } from '../lib/types.ts';
import BackLink from '../components/BackLink.tsx';

const ACCOUNTS = ['6060', '6070'];

export default function AdminDetail() {
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<SavedRequest | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRequest(id).then(setReq).catch(() => setError('Could not load that request.'));
    listCategories().then(setCategories).catch(() => {});
  }, [id]);

  if (error && !req) return <div className="card errors">{error}</div>;
  if (!req) return <p className="muted">Loading…</p>;

  const gaps = missingForPdf(req);
  const total = req.line_items.reduce((s, i) => s + Number(i.amount), 0);
  const set = (next: Partial<SavedRequest>) => setReq({ ...req, ...next });
  const patch = (itemId: string, next: Partial<SavedItem>) =>
    setReq({ ...req, line_items: req.line_items.map((x) => (x.id === itemId ? { ...x, ...next } : x)) });

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true); setError(null); setNote(null);
    try { await fn(); setNote(label); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }

  const openPdf = (blob: Blob) => window.open(URL.createObjectURL(blob), '_blank', 'noopener');

  return (
    <div className="stack">
      <BackLink to="/admin">Finance queue</BackLink>
      <div className="card">
        <div className="row-head">
          <h2>{req.payee_name}</h2>
          <span className={`pill ${req.status}`}>{req.status}</span>
        </div>
        <p className="muted">
          Submitted {new Date(req.created_at).toLocaleDateString()} by {req.submitter_email}
        </p>
      </div>

      {gaps.length > 0 && (
        <div className="card warnbox">
          <strong>Fill these in before generating the form:</strong>
          <ul>{gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
        </div>
      )}

      <div className="card stack-sm">
        <h2>Form header</h2>
        <div className="pair">
          <label>Payee
            <input value={req.payee_name} onChange={(e) => set({ payee_name: e.target.value })} />
          </label>
          <label>Address <span className="optional">optional</span>
            <input value={req.payee_address ?? ''} onChange={(e) => set({ payee_address: e.target.value })} />
          </label>
        </div>
        <div className="pair">
          <label>Name of requester
            <input value={req.requester_name ?? ''} placeholder="Who is filing this"
              onChange={(e) => set({ requester_name: e.target.value })} />
          </label>
          <label>Requested date
            <input type="date" value={req.requested_date ?? ''}
              onChange={(e) => set({ requested_date: e.target.value })} />
          </label>
        </div>
      </div>

      {req.line_items.map((it, n) => (
        <div className="card stack-sm" key={it.id}>
          <div className="row-head">
            <h2>Receipt {n + 1}</h2>
            <span className="dim">{RECEIPT_MODE_LABELS[it.receipt_mode as ReceiptMode]}</span>
          </div>

          <div className="pair">
            <label>Category
              <select value={it.item_category ?? ''}
                onChange={(e) => {
                  const name = e.target.value || null;
                  const code = categories.find((c) => c.name === name)?.code ?? it.code;
                  patch(it.id, { item_category: name, code });
                }}>
                <option value="">— none —</option>
                {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <label>Code <span className="optional">prints in "Name of Account"</span>
              <input value={it.code ?? ''} onChange={(e) => patch(it.id, { code: e.target.value })} />
            </label>
          </div>

          <div className="pair">
            <label>Account number
              <select value={it.account_number ?? '6060'}
                onChange={(e) => patch(it.id, { account_number: e.target.value })}>
                {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <span className="hint">6070 is the EM Retreat only.</span>
            </label>
            <label>Amount
              <input type="number" step="0.01" value={it.amount}
                onChange={(e) => patch(it.id, { amount: Number(e.target.value) })} />
            </label>
          </div>

          <div className="pair">
            <label>Description <span className="optional">line 1</span>
              <input value={it.description} maxLength={40}
                onChange={(e) => patch(it.id, { description: e.target.value })} />
            </label>
            <label>Store <span className="optional">line 2</span>
              <input value={it.vendor ?? ''} onChange={(e) => patch(it.id, { vendor: e.target.value })} />
            </label>
          </div>

          <label>Date
            <input type="date" value={it.spend_date}
              onChange={(e) => patch(it.id, { spend_date: e.target.value })} />
          </label>

          <div>
            <span className="hint">Receipts</span>
            {it.receipts.length === 0
              ? <p className="error small">Nothing attached — the form ticks "Attached", so this must be resolved first.</p>
              : <ul className="files">{it.receipts.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="link" onClick={async () => {
                      const u = await signedReceiptUrl(r.storage_path);
                      if (u) window.open(u, '_blank', 'noopener');
                    }}>{r.storage_path.split('/').pop()}</button>
                  </li>))}
                </ul>}
          </div>
        </div>
      ))}

      {error && <div className="card errors">{error}</div>}
      {note && <div className="card notice">{note}</div>}

      <div className="card stack-sm">
        <div className="submit-bar">
          <div>
            <span className="muted">Total</span>
            <strong className="total">${total.toFixed(2)}</strong>
          </div>
          <button type="button" disabled={busy}
            onClick={() => run('Changes saved.', () => adminSaveRequest(req))}>
            Save changes
          </button>
        </div>
        <div className="actions">
          <button type="button" className="button secondary" disabled={busy || gaps.length > 0}
            onClick={() => run('Preview opened.', async () => { openPdf(await buildFormPdf(req)); })}>
            Preview PDF
          </button>
          <button type="button" disabled={busy || gaps.length > 0}
            onClick={() => run('Form generated and marked reviewed.', async () => {
              await adminSaveRequest(req);
              openPdf(await generateForm(req));
              setReq(await getRequest(req.id));
            })}>
            Generate form &amp; mark reviewed
          </button>
          <button type="button" className="button secondary" disabled={busy}
            onClick={() => run('Sheet row copied.', async () => {
              await navigator.clipboard.writeText(toTSV(groupForSheet(req)));
            })}>
            Copy sheet rows
          </button>
          {req.status === 'reviewed' && (
            <button type="button" className="button secondary" disabled={busy}
              onClick={() => run('Marked paid.', async () => {
                await setStatus(req.id, 'paid');
                setReq(await getRequest(req.id));
              })}>
              Mark paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
