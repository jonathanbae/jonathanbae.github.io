import { supabase } from './supabase';
import { ALLOWED_TYPES, MAX_FILE_BYTES, type Category, type DraftItem } from './types';

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('name, code').order('name');
  if (error) throw error;
  return data ?? [];
}

/** Payee details remembered from this submitter's previous request, if any. */
export async function getSubmitter(email: string) {
  const { data, error } = await supabase
    .from('submitters')
    .select('full_name, address')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function validateFile(f: File): string | null {
  if (!ALLOWED_TYPES.includes(f.type)) return `${f.name}: only PDF, JPG, PNG or HEIC files are allowed.`;
  if (f.size > MAX_FILE_BYTES) return `${f.name}: larger than 10 MB.`;
  return null;
}

const slug = (s: string) => s.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-60);

export type SubmitInput = {
  submitter_email: string;
  payee_name: string;
  payee_address: string;
  items: DraftItem[];
};

export async function submitRequest(input: SubmitInput): Promise<string> {
  const email = input.submitter_email.trim().toLowerCase();
  const address = input.payee_address.trim();
  const categories = await listCategories();
  const codeOf = new Map(categories.map((c) => [c.name, c.code]));

  // Remember the payee details so the next request can prefill them.
  await supabase.from('submitters').upsert({
    email,
    full_name: input.payee_name.trim(),
    ...(address ? { address } : {}),
    updated_at: new Date().toISOString(),
  });

  const { data: req, error: reqErr } = await supabase
    .from('requests')
    .insert({
      submitter_email: email,
      payee_name: input.payee_name.trim(),
      payee_address: address || null,
    })
    .select('id')
    .single();
  if (reqErr) throw reqErr;

  const { data: rows, error: itemErr } = await supabase
    .from('line_items')
    .insert(input.items.map((it, i) => ({
      request_id: req.id,
      position: i,
      item_category: it.item_category,
      // 6070 is for the EM Retreat only; finance switches it during review.
      code: it.item_category ? codeOf.get(it.item_category) ?? null : null,
      account_number: '6060',
      description: it.description.trim(),
      vendor: it.vendor.trim(),
      amount: Number(it.amount),
      spend_date: it.spend_date,
      receipt_mode: it.receipt_mode,
    })))
    .select('id, position');
  if (itemErr) throw itemErr;

  const idByPosition = new Map(rows.map((r) => [r.position as number, r.id as string]));
  const failed: string[] = [];

  for (const [i, it] of input.items.entries()) {
    const lineItemId = idByPosition.get(i)!;
    for (const [n, file] of it.files.entries()) {
      const path = `${req.id}/${lineItemId}/${n}-${slug(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from('receipts')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) { failed.push(file.name); continue; }
      const { error: recErr } = await supabase.from('receipts').insert({
        line_item_id: lineItemId,
        storage_path: path,
        mime: file.type,
        size_bytes: file.size,
      });
      if (recErr) failed.push(file.name);
    }
  }

  await supabase.from('audit_log').insert({
    actor: email, action: 'request.submitted', request_id: req.id,
    payload: { items: input.items.length, upload_failures: failed.length },
  });

  if (failed.length) {
    throw new Error(
      `The request was saved, but these files did not upload: ${failed.join(', ')}. ` +
      `Open it from "View existing" and attach them again.`,
    );
  }
  return req.id;
}

/* ------------------------------------------------------------------ lookup */

export type Status = 'requested' | 'reviewed' | 'paid';

export type SavedItem = {
  id: string;
  position: number;
  item_category: string | null;
  code: string | null;
  account_number: string | null;
  description: string;
  vendor: string | null;
  amount: number;
  spend_date: string;
  receipt_mode: 'in_person' | 'needs_printing';
  receipts: { id: string; storage_path: string; mime: string | null }[];
};

export type SavedRequest = {
  id: string;
  submitter_email: string;
  status: Status;
  payee_name: string;
  payee_address: string | null;
  requester_name: string | null;
  requested_date: string | null;
  created_at: string;
  line_items: SavedItem[];
};

const REQUEST_SELECT =
  'id, submitter_email, status, payee_name, payee_address, requester_name, requested_date, created_at, ' +
  'line_items(id, position, item_category, code, account_number, description, vendor, amount, spend_date, receipt_mode, ' +
  'receipts(id, storage_path, mime))';

export async function listRequestsByEmail(email: string): Promise<SavedRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(REQUEST_SELECT)
    .eq('submitter_email', email.trim().toLowerCase())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SavedRequest[];
}

export async function getRequest(id: string): Promise<SavedRequest> {
  const { data, error } = await supabase.from('requests').select(REQUEST_SELECT).eq('id', id).single();
  if (error) throw error;
  return data as unknown as SavedRequest;
}

/** Short-lived URL for a private receipt; the bucket itself is never public. */
export async function signedReceiptUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

export async function uploadReceipts(requestId: string, lineItemId: string, files: File[]) {
  const failed: string[] = [];
  for (const [n, file] of files.entries()) {
    const path = `${requestId}/${lineItemId}/${Date.now()}-${n}-${slug(file.name)}`;
    const { error } = await supabase.storage
      .from('receipts').upload(path, file, { contentType: file.type, upsert: false });
    if (error) { failed.push(file.name); continue; }
    const { error: recErr } = await supabase.from('receipts')
      .insert({ line_item_id: lineItemId, storage_path: path, mime: file.type, size_bytes: file.size });
    if (recErr) failed.push(file.name);
  }
  if (failed.length) throw new Error(`These files did not upload: ${failed.join(', ')}`);
}

export async function saveRequest(req: SavedRequest, removedItemIds: string[]) {
  const { error: rErr } = await supabase.from('requests')
    .update({
      payee_name: req.payee_name.trim(),
      payee_address: req.payee_address?.trim() || null,
    })
    .eq('id', req.id);
  if (rErr) throw rErr;

  if (removedItemIds.length) {
    const { error } = await supabase.from('line_items').delete().in('id', removedItemIds);
    if (error) throw error;
  }

  for (const [i, it] of req.line_items.entries()) {
    const { error } = await supabase.from('line_items')
      .update({
        position: i,
        item_category: it.item_category,
        description: it.description.trim(),
        vendor: it.vendor?.trim() ?? null,
        amount: it.amount,
        spend_date: it.spend_date,
        receipt_mode: it.receipt_mode,
      })
      .eq('id', it.id);
    if (error) throw error;
  }

  await supabase.from('audit_log').insert({
    actor: req.submitter_email, action: 'request.edited', request_id: req.id,
    payload: { items: req.line_items.length, removed: removedItemIds.length },
  });
}
