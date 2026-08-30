// End-to-end check of the submit / lookup / edit path against the real project.
//   node scripts/e2e-submit.mjs user 'the-user-password' ['admin-password']
// Every step is announced before it runs and capped with a timeout, so a hang
// names the step it hung on instead of just sitting there.
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const DOMAIN = env.VITE_LOGIN_DOMAIN || 'characommunity.org';
const [role, password, adminPassword] = process.argv.slice(2);
if (!role || !password) {
  console.error("usage: node scripts/e2e-submit.mjs <user|pastor|admin> '<password>' ['<admin-password>']");
  process.exit(1);
}

// autoRefreshToken starts a timer that keeps Node's event loop alive forever,
// and persistSession looks for a browser store that does not exist here.
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let failures = 0;
async function step(label, fn, ms = 20000) {
  process.stdout.write(`  … ${label}\n`);
  let timer;
  try {
    const result = await Promise.race([
      Promise.resolve().then(fn),
      new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`timed out after ${ms / 1000}s`)), ms); }),
    ]);
    clearTimeout(timer);
    return result;
  } catch (e) {
    clearTimeout(timer);
    console.log(`  FAIL  ${label} — ${e.message}`);
    failures++;
    return { hung: true };
  }
}
const ok = (label, cond, extra = '') => {
  if (!cond) failures++;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  — ' + extra : ''}`);
};

const email = `e2e-test-${Date.now()}@example.com`;

const auth = await step('sign in', () => sb.auth.signInWithPassword({
  email: `finance.${role}@${DOMAIN}`, password }));
ok('sign in', !auth.error && !auth.hung, auth.error?.message ?? '');
if (auth.error || auth.hung) process.exit(1);

const cats = await step('read categories', () => sb.from('categories').select('name, code'));
ok('read categories', cats.data?.length === 21, `${cats.data?.length ?? 0} rows`);

const req = await step('create request', () => sb.from('requests')
  .insert({ submitter_email: email, payee_name: 'E2E Tester', payee_address: null })
  .select('id, status').single());
ok('create request', req.data?.status === 'requested', req.error?.message ?? '');
if (!req.data) process.exit(1);
const requestId = req.data.id;

const items = await step('create line items', () => sb.from('line_items').insert([
  { request_id: requestId, position: 0, item_category: 'Communion', code: '103', account_number: '6060',
    description: 'Communion', vendor: 'GIANT', amount: 5.04, spend_date: '2026-08-02', receipt_mode: 'in_person' },
  { request_id: requestId, position: 1, item_category: 'Book Club', code: '106', account_number: '6060',
    description: 'Book Club', vendor: 'COSTCO', amount: 61.34, spend_date: '2026-08-05', receipt_mode: 'needs_printing' },
]).select('id, position'));
ok('create line items', items.data?.length === 2, items.error?.message ?? '');

let path = null;
if (items.data?.length) {
  const blob = new Blob(['%PDF-1.4 e2e test receipt'], { type: 'application/pdf' });
  path = `${requestId}/${items.data[0].id}/0-test.pdf`;
  const up = await step('upload receipt to storage',
    () => sb.storage.from('receipts').upload(path, blob, { contentType: 'application/pdf' }));
  ok('upload receipt', !up.error && !up.hung, up.error?.message ?? '');

  const rec = await step('record receipt row', () => sb.from('receipts').insert({
    line_item_id: items.data[0].id, storage_path: path, mime: 'application/pdf', size_bytes: 24 }));
  ok('record receipt row', !rec.error && !rec.hung, rec.error?.message ?? '');

  const signed = await step('sign a URL for the private file',
    () => sb.storage.from('receipts').createSignedUrl(path, 60));
  ok('signed URL', !!signed.data?.signedUrl, signed.error?.message ?? '');
}

// These only pass once supabase/hardening.sql has been run.
const badType = await step('reject a disallowed file type', () => sb.storage.from('receipts')
  .upload(`${requestId}/blocked.txt`, new Blob(['nope'], { type: 'text/plain' }),
          { contentType: 'text/plain' }));
ok('disallowed file type is rejected', !!badType.error,
   badType.error?.message ?? 'UPLOAD SUCCEEDED — run supabase/hardening.sql');

const back = await step('look up by email', () => sb.from('requests')
  .select('id, payee_name, line_items(id, amount, receipts(id))').eq('submitter_email', email));
const found = back.data?.[0];
const total = found?.line_items.reduce((s, i) => s + Number(i.amount), 0) ?? 0;
ok('look up by email', found?.id === requestId, `total ${total}`);
ok('total is 66.38', Math.abs(total - 66.38) < 0.001);

const edit = await step('edit while requested',
  () => sb.from('line_items').update({ amount: 7.5 }).eq('id', items.data[0].id));
ok('edit while requested', !edit.error && !edit.hung, edit.error?.message ?? '');

const del = await step('try to delete as this role',
  () => sb.from('requests').delete().eq('id', requestId).select('id'));
ok('delete refused for non-admin', role === 'admin' || del.data?.length === 0,
   `RLS deleted ${del.data?.length ?? 0} rows`);

const bump = await step('try to mark paid as this role',
  () => sb.from('requests').update({ status: 'paid' }).eq('id', requestId).select('id'));
ok('non-admin cannot mark paid', role === 'admin' || (bump.data?.length ?? 0) === 0,
   bump.error?.message ?? `updated ${bump.data?.length ?? 0} rows`);

console.log(`\n  test request id: ${requestId}\n  test email: ${email}`);

if (adminPassword) {
  await step('sign out', () => sb.auth.signOut());
  const a = await step('sign in as admin', () => sb.auth.signInWithPassword({
    email: `finance.admin@${DOMAIN}`, password: adminPassword }));
  ok('sign in as admin', !a.error && !a.hung, a.error?.message ?? '');
  // The admin path the app relies on: store a generated form, advance status, mark paid.
  const formPath = `forms/${requestId}/${Date.now()}-payment-request.pdf`;
  const formBlob = new Blob(['%PDF-1.4 generated form'], { type: 'application/pdf' });
  const fu = await step('admin uploads generated form',
    () => sb.storage.from('receipts').upload(formPath, formBlob, { contentType: 'application/pdf' }));
  ok('admin uploads generated form', !fu.error && !fu.hung, fu.error?.message ?? '');

  const rev = await step('admin marks reviewed', () => sb.from('requests')
    .update({ status: 'reviewed', form_pdf_paths: [formPath], requester_name: 'E2E Admin',
              requested_date: '2026-08-30' })
    .eq('id', requestId).select('id, status').single());
  ok('admin marks reviewed', rev.data?.status === 'reviewed', rev.error?.message ?? '');

  const paid = await step('admin marks paid', () => sb.from('requests')
    .update({ status: 'paid' }).eq('id', requestId).select('id, status').single());
  ok('admin marks paid', paid.data?.status === 'paid', paid.error?.message ?? '');

  const audit = await step('admin reads audit log',
    () => sb.from('audit_log').select('action').eq('request_id', requestId));
  ok('admin reads audit log', Array.isArray(audit.data), audit.error?.message ?? '');

  if (path) await step('remove test receipt', () => sb.storage.from('receipts').remove([path]));
  await step('remove test form', () => sb.storage.from('receipts').remove([formPath]));
  const d = await step('admin delete', () => sb.from('requests').delete().eq('id', requestId).select('id'));
  ok('admin can delete', d.data?.length === 1, d.error?.message ?? '');
} else {
  console.log('  (pass the admin password as a 3rd arg to clean this row up)');
}

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
await sb.auth.signOut();
process.exit(failures ? 1 : 0);
