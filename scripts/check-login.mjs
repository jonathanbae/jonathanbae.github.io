// Diagnose a sign-in without going through the UI.
//   node scripts/check-login.mjs user 'the-password'
// Prints the raw Supabase auth response, then the profile row it resolves to.
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const URL_ = env.VITE_SUPABASE_URL, KEY = env.VITE_SUPABASE_ANON_KEY;
const DOMAIN = env.VITE_LOGIN_DOMAIN || 'characommunity.org';

const [role, password] = process.argv.slice(2);
if (!role || !password) {
  console.error("usage: node scripts/check-login.mjs <user|pastor|admin> '<password>'");
  process.exit(1);
}
const email = `finance.${role}@${DOMAIN}`;
console.log('signing in as', email);

const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const body = await r.json();
if (!r.ok) {
  console.log('FAILED', r.status, body);
  process.exit(1);
}
console.log('OK — signed in, user id', body.user.id);

const p = await fetch(`${URL_}/rest/v1/profiles?select=email,role`, {
  headers: { apikey: KEY, Authorization: `Bearer ${body.access_token}` },
});
const rows = await p.json();
console.log('profile row:', rows);
if (!rows.length) console.log('^ EMPTY — the profiles backfill did not cover this user, so the app sees no role.');
