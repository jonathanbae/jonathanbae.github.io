import { supabase } from './supabase.ts';
import { auditActor } from './operator.ts';
import { PAGE_SIZE, type Page, type SavedRequest } from './api.ts';

const PASTOR_SELECT =
  'id, submitter_email, status, payee_name, payee_address, requester_name, requested_date, form_pdf_paths, ' +
  'pastor_name, pastor_signature, pastor_signed_at, rejected_reason, created_at, ' +
  'line_items(id, position, item_category, code, account_number, description, vendor, amount, spend_date, ' +
  'receipt_mode, receipts(id, storage_path, mime))';

/** Requests still awaiting the pastor. `signed` flips to the already-approved list. */
export async function listForPastor(
  signed = false, page = 0, pageSize = PAGE_SIZE,
): Promise<Page<SavedRequest>> {
  const from = page * pageSize;
  let q = supabase
    .from('requests')
    .select(PASTOR_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);
  q = signed ? q.not('pastor_signed_at', 'is', null) : q.is('pastor_signed_at', null).eq('status', 'requested');
  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as unknown as SavedRequest[], total: count ?? 0, page, pageSize };
}

/**
 * Stamp the pastor's approval onto one or more requests. The signature image is
 * stored per request rather than referenced, so a later change to the pastor's
 * saved signature cannot retroactively alter what they already approved.
 */
export async function signRequests(ids: string[], name: string, signature: string) {
  if (!ids.length) return 0;
  const { data, error } = await supabase
    .from('requests')
    .update({
      pastor_name: name.trim(),
      pastor_signature: signature,
      pastor_signed_at: new Date().toISOString(),
    })
    .in('id', ids)
    .select('id');
  if (error) throw error;

  await supabase.from('audit_log').insert(
    (data ?? []).map((r) => ({
      actor: auditActor(),
      action: 'request.pastor_signed',
      request_id: r.id,
      payload: { name: name.trim() },
    })),
  );
  return data?.length ?? 0;
}
