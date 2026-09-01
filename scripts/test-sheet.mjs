import test from 'node:test';
import assert from 'node:assert/strict';
import { SHEET_HEADERS, groupForSheet, toTSV } from '../src/lib/sheet.ts';

const item = (o) => ({
  id: o.id, position: 0, item_category: o.cat ?? null, code: o.code ?? null,
  account_number: '6060', description: o.desc, vendor: o.vendor ?? null,
  amount: o.amount, spend_date: o.date ?? '2026-08-02',
  receipt_mode: 'in_person', receipts: [],
});
const req = (items) => ({
  id: 'r1', submitter_email: 'a@b.c', status: 'reviewed', payee_name: 'Sarah Bae',
  payee_address: null, requester_name: null, requested_date: null,
  created_at: '2026-08-30', line_items: items,
});

test('items sharing a code collapse into one row with amounts summed', () => {
  const rows = groupForSheet(req([
    item({ id: '1', cat: "Women's Ministry", code: '106', desc: "Women's Retreat", vendor: "Trader Joe's", amount: 107.08 }),
    item({ id: '2', cat: "Women's Ministry", code: '106', desc: "Women's Retreat", vendor: 'Giant', amount: 64.42 }),
    item({ id: '3', cat: 'Book Club', code: '106', desc: 'Book Club', vendor: 'Costco', amount: 61.34 }),
  ]));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount, '$232.84');
  assert.equal(rows[0].item, "Women's Ministry, Book Club");
  assert.equal(rows[0].description.split('\n').length, 3);
});

test('different codes stay on separate rows', () => {
  const rows = groupForSheet(req([
    item({ id: '1', cat: 'Communion', code: '103', desc: 'Communion', vendor: 'Giant', amount: 5.04 }),
    item({ id: '2', cat: 'Members Meeting', code: '107', desc: 'Members Meeting', vendor: 'Walmart', amount: 42.17 }),
  ]));
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(r => r.code).sort(), ['103', '107']);
});

test('a mixed-date group falls back to the earliest date', () => {
  const rows = groupForSheet(req([
    item({ id: '1', code: '106', desc: 'A', amount: 1, date: '2026-08-20' }),
    item({ id: '2', code: '106', desc: 'B', amount: 2, date: '2026-08-05' }),
  ]));
  assert.equal(rows[0].date, '8/5/2026');
});

test('uncategorised items group under an empty code', () => {
  const rows = groupForSheet(req([item({ id: '1', desc: 'Something', vendor: 'Target', amount: 9.99 })]));
  assert.equal(rows[0].code, '');
  assert.equal(rows[0].item, '');
  assert.equal(rows[0].description, 'Something - Target');
});

test('multi-line cells are quoted so a paste stays in one cell', () => {
  const rows = groupForSheet(req([
    item({ id: '1', code: '106', desc: 'A', vendor: 'X', amount: 1 }),
    item({ id: '2', code: '106', desc: 'B', vendor: 'Y', amount: 2 }),
  ]));
  const tsv = toTSV(rows);
  assert.equal(tsv.split('\t').length, SHEET_HEADERS.length);
  assert.match(tsv, /"A - X\nB - Y"/);
});

test('header row is emitted on request', () => {
  const tsv = toTSV(groupForSheet(req([item({ id: '1', code: '103', desc: 'A', amount: 1 })])), true);
  assert.equal(tsv.split('\n')[0].split('\t')[0], 'Name');
});

test('Check Received is blank until the request is paid', () => {
  const items = [item({ id: '1', code: '103', desc: 'A', amount: 1 })];
  assert.equal(groupForSheet(req(items))[0].checkReceived, '');
  assert.equal(groupForSheet({ ...req(items), status: 'paid' })[0].checkReceived, 'Yes');
});

test('columns land in the sheet order', () => {
  const rows = groupForSheet(req([item({ id: '1', code: '103', desc: 'A', vendor: 'X', amount: 5 })]));
  const cells = toTSV(rows).split('\t');
  assert.equal(cells.length, SHEET_HEADERS.length);
  assert.deepEqual(
    [cells[0], cells[2], cells[4], cells[8]],
    ['Sarah Bae', '$5.00', '103', '']);
});

test('tracker picks the sheet for the year, and falls back to the newest', async () => {
  const { trackerFor, trackerYears } = await import('../src/lib/trackers.ts');
  assert.equal(trackerFor(2026).year, '2026');
  assert.equal(trackerFor(2025).year, '2025');
  // A year with no sheet yet keeps using the most recent one rather than breaking.
  assert.equal(trackerFor(2027).year, '2026');
  // Before the earliest sheet, fall back to the oldest we have.
  assert.equal(trackerFor(2019).year, '2025');
  assert.deepEqual(trackerYears(), ['2026', '2025']);
});

test('search terms cannot inject extra PostgREST filter conditions', async () => {
  const { sanitizeSearch } = await import('../src/lib/search.ts');
  // commas and parens are the filter grammar; they must not survive
  assert.equal(sanitizeSearch('sarah,status.eq.paid'), 'sarahstatus.eq.paid');
  assert.equal(sanitizeSearch('a),or(id.gt.0'), 'aorid.gt.0');
  // what matters is that the grammar characters are gone
  assert.ok(!/[,()%*]/.test(sanitizeSearch('a),or(id.gt.0,status.eq.paid)')));
  // wildcards would turn any search into a full scan
  assert.equal(sanitizeSearch('%%%'), '');
  // ordinary searches survive intact, emails included
  assert.equal(sanitizeSearch('  Sarah Bae '), 'Sarah Bae');
  assert.equal(sanitizeSearch('sarah.bae@characommunity.org'), 'sarah.bae@characommunity.org');
  assert.equal(sanitizeSearch('x'.repeat(200)).length, 60);
});
