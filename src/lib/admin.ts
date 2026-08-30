import templateUrl from '../assets/template-p1.pdf?url';
import { fillForm, type FormRequest } from '../form/fill.ts';
import { supabase } from './supabase.ts';
import { getRequest, signedReceiptUrl, type SavedItem, type SavedRequest, type Status } from './api.ts';

export async function listAllRequests(status?: Status | 'all'): Promise<SavedRequest[]> {
  let q = supabase
    .from('requests')
    .select('id, submitter_email, status, payee_name, payee_address, requester_name, requested_date, created_at, ' +
            'line_items(id, position, item_category, code, account_number, description, vendor, amount, spend_date, ' +
            'receipt_mode, receipts(id, storage_path, mime))')
    .order('created_at', { ascending: false });
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as SavedRequest[];
}

/** Finance may override anything, including fields the submitter could not set. */
export async function adminSaveRequest(req: SavedRequest) {
  const { error } = await supabase.from('requests').update({
    payee_name: req.payee_name.trim(),
    payee_address: req.payee_address?.trim() || null,
    requester_name: req.requester_name?.trim() || null,
    requested_date: req.requested_date || null,
  }).eq('id', req.id);
  if (error) throw error;

  for (const [i, it] of req.line_items.entries()) {
    const { error: e } = await supabase.from('line_items').update({
      position: i,
      item_category: it.item_category,
      code: it.code,
      account_number: it.account_number,
      description: it.description.trim(),
      vendor: it.vendor?.trim() ?? null,
      amount: it.amount,
      spend_date: it.spend_date,
      receipt_mode: it.receipt_mode,
    }).eq('id', it.id);
    if (e) throw e;
  }
  await supabase.from('audit_log').insert({
    action: 'request.admin_edited', request_id: req.id, payload: { items: req.line_items.length },
  });
}

/** Everything the PDF needs that the submitter is not required to provide. */
export function missingForPdf(req: SavedRequest): string[] {
  const gaps: string[] = [];
  if (!req.payee_name?.trim()) gaps.push('Payee name');
  if (!req.requester_name?.trim()) gaps.push('Name of requester');
  if (!req.requested_date) gaps.push('Requested date');
  req.line_items.forEach((it, n) => {
    if (!it.code) gaps.push(`Receipt ${n + 1}: account code (the "Name of Account" box)`);
    if (!it.account_number) gaps.push(`Receipt ${n + 1}: account number`);
    if (!it.description?.trim()) gaps.push(`Receipt ${n + 1}: description`);
    // The form's Receipt box is always ticked "Attached", so it had better be.
    if (it.receipts.length === 0) gaps.push(`Receipt ${n + 1}: no receipt file attached`);
  });
  return gaps;
}

const toFormRequest = (req: SavedRequest): FormRequest => ({
  educationDept: 'CHARA EM',
  payee: req.payee_name,
  address: req.payee_address ?? '',
  requester: req.requester_name ?? '',
  requestedDate: req.requested_date ? new Date(`${req.requested_date}T00:00:00`) : null,
  lineItems: req.line_items.map((it: SavedItem) => ({
    category: it.description,
    vendor: it.vendor ?? '',
    accountNumber: it.account_number ?? '6060',
    code: it.code ?? '',
    amount: Number(it.amount),
  })),
});

let templateCache: ArrayBuffer | null = null;
async function template(): Promise<ArrayBuffer> {
  if (!templateCache) templateCache = await (await fetch(templateUrl)).arrayBuffer();
  return templateCache;
}

/** Build the PDF without saving anything — used for preview. */
export async function buildFormPdf(req: SavedRequest): Promise<Blob> {
  const bytes = await fillForm(await template(), toFormRequest(req));
  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
}

/** Build, store, and advance the request to `reviewed`. */
export async function generateForm(req: SavedRequest): Promise<Blob> {
  const blob = await buildFormPdf(req);
  const path = `forms/${req.id}/${Date.now()}-payment-request.pdf`;
  const { error: upErr } = await supabase.storage
    .from('receipts').upload(path, blob, { contentType: 'application/pdf' });
  if (upErr) throw upErr;

  const { error } = await supabase.from('requests').update({
    status: 'reviewed',
    form_pdf_paths: [path],
  }).eq('id', req.id);
  if (error) throw error;

  await supabase.from('audit_log').insert({
    action: 'request.reviewed', request_id: req.id, payload: { path },
  });
  return blob;
}

export async function setStatus(id: string, status: Status) {
  const { error } = await supabase.from('requests').update({ status }).eq('id', id);
  if (error) throw error;
  await supabase.from('audit_log').insert({ action: `request.${status}`, request_id: id });
}

/** Signed links for every receipt, keyed by line item — used to fill the sheet columns. */
export async function receiptLinksByItem(req: SavedRequest): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const it of req.line_items) {
    const urls: string[] = [];
    for (const r of it.receipts) {
      const u = await signedReceiptUrl(r.storage_path);
      if (u) urls.push(u);
    }
    out[it.id] = urls;
  }
  return out;
}

export { getRequest };
