import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  errMessage, getRequest, listCategories, saveRequest, signedReceiptUrl, uploadReceipts, validateFile,
  type SavedItem, type SavedRequest,
} from '../lib/api';
import { MAX_DESCRIPTION, RECEIPT_MODE_LABELS, type Category, type ReceiptMode } from '../lib/types';
import BackLink from '../components/BackLink.tsx';
import { FilePickButtons } from '../components/ReceiptPicker.tsx';
import { prepareFiles } from '../lib/compress.ts';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<SavedRequest | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRequest(id).then(setReq).catch(() => setError('Could not load that request.'));
    listCategories().then(setCategories).catch(() => {});
  }, [id]);

  if (error) return <div className="card"><p className="error">{error}</p></div>;
  if (!req) return <p className="muted">Loading…</p>;

  const editable = req.status === 'requested';
  const total = req.line_items.reduce((s, i) => s + Number(i.amount), 0);

  const patch = (itemId: string, next: Partial<SavedItem>) =>
    setReq({ ...req, line_items: req.line_items.map((x) => (x.id === itemId ? { ...x, ...next } : x)) });

  async function openReceipt(path: string) {
    const url = await signedReceiptUrl(path);
    if (url) window.open(url, '_blank', 'noopener');
  }

  async function attach(item: SavedItem, chosen: File[]) {
    setBusy(true);
    const files = (await prepareFiles(chosen)).map((p) => p.file);
    setBusy(false);
    const bad = files.map(validateFile).find(Boolean);
    if (bad) return setError(bad);
    setBusy(true); setError(null);
    try {
      await uploadReceipts(req!.id, item.id, files);
      setReq(await getRequest(req!.id));
      setStatus('Receipt attached.');
    } catch (e) {
      setError(errMessage(e, 'Upload failed.'));
    } finally { setBusy(false); }
  }

  async function save() {
    setBusy(true); setError(null); setStatus(null);
    try {
      await saveRequest(req!, removed);
      setRemoved([]);
      setReq(await getRequest(req!.id));
      setStatus('Changes saved.');
    } catch (e) {
      setError(errMessage(e, 'Could not save.'));
    } finally { setBusy(false); }
  }

  return (
    <div className="stack">
      <BackLink to="/view">All my requests</BackLink>
      <div className="card">
        <div className="row-head">
          <h2>Request for {req.payee_name}</h2>
          <span className={`pill ${req.status}`}>{req.status}</span>
        </div>
        <p className="muted">
          Submitted {new Date(req.created_at).toLocaleDateString()} by {req.submitter_email}.
        </p>
        {!editable && req.status !== 'rejected' && (
          <p className="muted">
            The finance team has started on this one, so it can no longer be edited here.
            Contact them if something needs to change.
          </p>
        )}
        {req.pastor_signed_at && (
          <p className="muted">
            Signed off by {req.pastor_name ?? 'the pastor'} on{' '}
            {new Date(req.pastor_signed_at).toLocaleDateString()}.
          </p>
        )}
      </div>

      {req.note_to_submitter && req.status === 'requested' && (
        <div className="card warnbox">
          <strong>The finance team asked for a change:</strong>
          <p className="muted">{req.note_to_submitter}</p>
        </div>
      )}

      {req.status === 'rejected' && (
        <div className="card warnbox">
          <strong>This request was turned down.</strong>
          <p className="muted">{req.rejected_reason || 'No reason was recorded.'}</p>
        </div>
      )}

      <div className="card stack-sm">
        <label>
          Name of the person being paid back
          <input value={req.payee_name} disabled={!editable}
            onChange={(e) => setReq({ ...req, payee_name: e.target.value })} />
        </label>
        <label>
          Address <span className="optional">optional</span>
          <input value={req.payee_address ?? ''} disabled={!editable}
            onChange={(e) => setReq({ ...req, payee_address: e.target.value })} />
        </label>
      </div>

      {req.line_items.map((it, n) => (
        <div className="card stack-sm" key={it.id}>
          <div className="row-head">
            <h2>Receipt {n + 1}</h2>
            {editable && req.line_items.length > 1 && (
              <button type="button" className="link" onClick={() => {
                setRemoved([...removed, it.id]);
                setReq({ ...req, line_items: req.line_items.filter((x) => x.id !== it.id) });
              }}>Remove</button>
            )}
          </div>

          <label>
            Category <span className="optional">optional</span>
            <select value={it.item_category ?? ''} disabled={!editable}
              onChange={(e) => patch(it.id, { item_category: e.target.value || null })}>
              <option value="">— not sure —</option>
              {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </label>

          <label>
            What was it for?
            <input value={it.description} maxLength={MAX_DESCRIPTION} disabled={!editable}
              onChange={(e) => patch(it.id, { description: e.target.value })} />
          </label>

          <label>
            Where was it bought?
            <input value={it.vendor ?? ''} disabled={!editable}
              onChange={(e) => patch(it.id, { vendor: e.target.value })} />
          </label>

          <div className="pair">
            <label>
              Date
              <input type="date" value={it.spend_date} disabled={!editable}
                onChange={(e) => patch(it.id, { spend_date: e.target.value })} />
            </label>
            <label>
              Amount
              <input type="number" step="0.01" min="0" value={it.amount} disabled={!editable}
                onChange={(e) => patch(it.id, { amount: Number(e.target.value) })} />
            </label>
          </div>

          <fieldset className="modes" disabled={!editable}>
            <legend>The receipt itself</legend>
            {(Object.keys(RECEIPT_MODE_LABELS) as ReceiptMode[]).map((m) => (
              <label className="radio" key={m}>
                <input type="radio" name={`mode-${it.id}`} checked={it.receipt_mode === m}
                  onChange={() => patch(it.id, { receipt_mode: m })} />
                {RECEIPT_MODE_LABELS[m]}
              </label>
            ))}
          </fieldset>

          <div>
            <span className="hint">Attached files</span>
            {it.receipts.length === 0 && (
              <p className="error small">No receipt attached — please add one below.</p>
            )}
            <ul className="files">
              {it.receipts.map((r) => (
                <li key={r.id}>
                  <button type="button" className="link" onClick={() => openReceipt(r.storage_path)}>
                    {r.storage_path.split('/').pop()}
                  </button>
                </li>
              ))}
            </ul>
            {editable && (
              <FilePickButtons busy={busy} onPick={(files) => attach(it, files)} />
            )}
          </div>
        </div>
      ))}

      {error && <div className="card errors">{error}</div>}
      {status && <div className="card notice">{status}</div>}

      <div className="card submit-bar">
        <div>
          <span className="muted">Total</span>
          <strong className="total">${total.toFixed(2)}</strong>
        </div>
        {editable
          ? <button type="button" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          : <Link className="button secondary" to="/view">Back</Link>}
      </div>
    </div>
  );
}
