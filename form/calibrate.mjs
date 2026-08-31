// Calibration harness: fills the form with known data and renders PNGs to eyeball.
//   node form/calibrate.mjs            -> the 3-item sample matching the scanned form
//   node form/calibrate.mjs overflow   -> 6 items, must produce 2 standalone forms
// Requires poppler (`brew install poppler`) for pdftoppm.
import fs from 'fs';
import { execFileSync } from 'child_process';
import { fillForm } from '../src/form/fill.ts';

const mk = (category, vendor, amount, code, accountNumber = '6060') =>
  ({ category, vendor, amount, code, accountNumber });

const base = {
  educationDept: 'CHARA EM',
  payee: 'Sarah Bae',
  address: '',
  requester: 'Jonathan Bae',
  requestedDate: new Date(2026, 7, 30),
};

const signature = 'data:image/png;base64,' +
  fs.readFileSync('form/fixtures/signature.png').toString('base64');

const cases = {
  // mirrors the hand-filled form we calibrated against
  sample: { ...base, lineItems: [
    mk("Women's Retreat", "TRADER JOE'S", 107.08, '106'),
    mk("Women's Retreat", 'GIANT', 64.42, '106'),
    mk('Book Club', 'COSTCO', 61.34, '106'),
  ]},
  // pastor sign-off stamped into the Minister Signature box
  signed: { ...base, ministerSignature: signature, lineItems: [
    mk('Communion', 'GIANT', 5.04, '103'),
  ]},
  overflow: { ...base, address: '123 Pilgrim Way, Beltsville, MD 20705', lineItems: [
    mk('Communion', 'GIANT', 5.04, '103'),
    mk('Members Meeting', 'WALMART', 42.17, '107'),
    mk('Book Club', 'COSTCO', 61.34, '106'),
    mk('Life Groups', "TRADER JOE'S", 128.90, '104'),
    mk('EM Retreat', 'AIRBNB', 1240.55, '109', '6070'),
    mk('Creative Team', 'AMAZON', 87.20, '103'),
  ]},
};

const name = process.argv[2] || 'sample';
const req = cases[name];
if (!req) throw new Error(`unknown case "${name}" (have: ${Object.keys(cases).join(', ')})`);

fs.mkdirSync('form/out', { recursive: true });
const pdf = `form/out/${name}.pdf`;
fs.writeFileSync(pdf, await fillForm(fs.readFileSync('src/assets/template-p1.pdf'), req));
execFileSync('pdftoppm', ['-png', '-r', '150', pdf, `form/out/${name}`]);
const total = req.lineItems.reduce((s, i) => s + i.amount, 0);
console.log(`${pdf}  (${req.lineItems.length} items, grand total ${total.toFixed(2)})`);
fs.readdirSync('form/out').filter(f => f.startsWith(name) && f.endsWith('.png')).forEach(f => console.log('  form/out/' + f));
