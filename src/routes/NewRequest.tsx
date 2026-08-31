import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { errMessage, getSubmitter, listCategories, submitRequest, validateFile } from '../lib/api';
import { FilePickButtons, ReceiptThumbs, appendPrepared } from '../components/ReceiptPicker.tsx';
import {
  MAX_DESCRIPTION, RECEIPT_MODE_LABELS,
  type Category, type DraftItem, type ReceiptMode,
} from '../lib/types';

const today = () => new Date().toISOString().slice(0, 10);
const blankItem = (): DraftItem => ({
  key: crypto.randomUUID(),
  item_category: null, description: '', vendor: '',
  amount: '', spend_date: today(), receipt_mode: 'in_person', files: [],
});

export default function NewRequest() {
  const nav = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [email, setEmail] = useState('');
  const [payee, setPayee] = useState('');
  const [address, setAddress] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([blankItem()]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [shrinking, setShrinking] = useState<Set<string>>(new Set());


  useEffect(() => { listCategories().then(setCategories).catch(() => {}); }, []);

  // Returning submitters get their payee details back automatically.
  async function lookupSubmitter() {
    if (!email.includes('@')) return;
    try {
      const s = await getSubmitter(email);
      if (!s) return;
      setPayee((p) => p || s.full_name || '');
      setAddress((a) => a || s.address || '');
      setPrefilled(true);
    } catch { /* prefill is a convenience; never block on it */ }
  }

  const patch = (key: string, next: Partial<DraftItem>) =>
    setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...next } : x)));
  async function pickFiles(key: string, chosen: File[]) {
    setShrinking((s) => new Set(s).add(key));
    const current = items.find((x) => x.key === key)?.files ?? [];
    patch(key, { files: await appendPrepared(current, chosen) });
    setShrinking((s) => { const n = new Set(s); n.delete(key); return n; });
  }

  const removeFile = (key: string, index: number) =>
    setItems((xs) => xs.map((x) =>
      x.key === key ? { ...x, files: x.files.filter((_, i) => i !== index) } : x));

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  function validate(): string[] {
    const e: string[] = [];
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.push('Enter the email you want to use to find this request later.');
    if (!payee.trim()) e.push('Enter the name of the person being reimbursed.');
    items.forEach((it, n) => {
      const at = `Receipt ${n + 1}`;
      if (!it.description.trim()) e.push(`${at}: say what it was for.`);
      if (it.description.length > MAX_DESCRIPTION) e.push(`${at}: description must be ${MAX_DESCRIPTION} characters or fewer.`);
      if (!it.vendor.trim()) e.push(`${at}: say where it was bought.`);
      if (!(Number(it.amount) > 0)) e.push(`${at}: enter an amount.`);
      if (!it.spend_date) e.push(`${at}: enter the date.`);
      if (it.files.length === 0)
        e.push(`${at}: attach a photo or PDF of the receipt.`);
      it.files.forEach((f) => { const m = validateFile(f); if (m) e.push(`${at}: ${m}`); });
    });
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (found.length) return;
    setBusy(true);
    try {
      await submitRequest({ submitter_email: email, payee_name: payee, payee_address: address, items });
      nav(`/view?email=${encodeURIComponent(email.trim().toLowerCase())}&submitted=1`);
    } catch (err) {
      setErrors([errMessage(err, 'Could not submit. Please try again.')]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="card stack-sm">
        <h2>Who is this for?</h2>
        <label>
          Your email
          <input type="email" value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)} onBlur={lookupSubmitter} />
          <span className="hint">You will use this to find and edit the request later.</span>
        </label>
        <label>
          Name of the person being paid back
          <input value={payee} onChange={(e) => setPayee(e.target.value)} />
        </label>
        <label>
          Address <span className="optional">optional</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
          <span className="hint">
            {prefilled ? 'Filled in from your last request.' : 'Only needed the first time, so a check can be mailed.'}
          </span>
        </label>
      </div>

      {items.map((it, n) => (
        <div className="card stack-sm" key={it.key}>
          <div className="row-head">
            <h2>Receipt {n + 1}</h2>
            {items.length > 1 && (
              <button type="button" className="link"
                onClick={() => setItems((xs) => xs.filter((x) => x.key !== it.key))}>
                Remove
              </button>
            )}
          </div>

          <label>
            Category <span className="optional">optional</span>
            <select
              value={it.item_category ?? ''}
              onChange={(e) => {
                const name = e.target.value || null;
                // Seed the description from the category, but leave it editable.
                patch(it.key, { item_category: name, description: it.description || name || '' });
              }}>
              <option value="">— not sure —</option>
              {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <span className="hint">
              Not sure? Leave this blank and write a clear description — the finance team will fill it in.
            </span>
          </label>

          <label>
            What was it for?
            <input value={it.description} maxLength={MAX_DESCRIPTION}
              onChange={(e) => patch(it.key, { description: e.target.value })} />
            <span className="hint">{MAX_DESCRIPTION - it.description.length} characters left</span>
          </label>

          <label>
            Where was it bought?
            <input value={it.vendor} placeholder="Walmart"
              onChange={(e) => patch(it.key, { vendor: e.target.value })} />
          </label>

          <div className="pair">
            <label>
              Date
              <input type="date" value={it.spend_date}
                onChange={(e) => patch(it.key, { spend_date: e.target.value })} />
            </label>
            <label>
              Amount
              <input type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00"
                value={it.amount} onChange={(e) => patch(it.key, { amount: e.target.value })} />
            </label>
          </div>

          <fieldset className="modes">
            <legend>The receipt itself</legend>
            {(Object.keys(RECEIPT_MODE_LABELS) as ReceiptMode[]).map((m) => (
              <label className="radio" key={m}>
                <input type="radio" name={`mode-${it.key}`} checked={it.receipt_mode === m}
                  onChange={() => patch(it.key, { receipt_mode: m })} />
                {RECEIPT_MODE_LABELS[m]}
              </label>
            ))}
          </fieldset>

          <div className="field">
            <span className="field-label">Attach the receipt</span>
            <FilePickButtons busy={shrinking.has(it.key)}
              onPick={(files) => pickFiles(it.key, files)} />
            <span className="hint">
              {shrinking.has(it.key)
                ? 'Resizing photo…'
                : 'Required — a photo is fine, even if you are handing in the paper receipt.'}
            </span>
            <ReceiptThumbs files={it.files} onRemove={(i) => removeFile(it.key, i)} />
          </div>
        </div>
      ))}

      <button type="button" className="button secondary"
        onClick={() => setItems((xs) => [...xs, blankItem()])}>
        Add another receipt
      </button>

      {errors.length > 0 && (
        <div className="card errors">
          <strong>Please fix these first:</strong>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <div className="card submit-bar">
        <div>
          <span className="muted">Total</span>
          <strong className="total">${total.toFixed(2)}</strong>
        </div>
        <button disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
      </div>
    </form>
  );
}
