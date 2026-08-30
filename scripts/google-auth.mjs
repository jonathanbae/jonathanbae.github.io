// One-time Google consent, to mint a refresh token for the Drive sync.
//
//   node scripts/google-auth.mjs <client-id> <client-secret>
//
// Opens the consent screen, catches the redirect on localhost, exchanges the
// code, then PROVES the token works by uploading a probe file into each of the
// three folders and deleting it again. Prints the secrets to set on Supabase.
import http from 'http';
import { execFile } from 'child_process';

const [clientId, clientSecret] = process.argv.slice(2);
if (!clientId || !clientSecret) {
  console.error('usage: node scripts/google-auth.mjs <client-id> <client-secret>');
  process.exit(1);
}

const PORT = 8976;
const REDIRECT = `http://localhost:${PORT}`;
// drive.file grants access only to files this app creates — not your whole Drive.
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

const FOLDERS = {
  root: '19slSTc9Zn1p4S5SClInmdKOsrqaaMLBr',
  forms: '1iK543scU7xKkEzkNIA0xUc0_gGgdaS73',
  receipts: '1dXdRFMiXW1S9UxDKC9XMkvU8iJtlWe0R',
};

const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline',
  prompt: 'consent',           // force a refresh_token even on repeat runs
});

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, REDIRECT);
    const c = url.searchParams.get('code');
    const err = url.searchParams.get('error');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<p style="font:16px system-ui;padding:2rem">${c ? 'Done — you can close this tab.' : 'Failed: ' + err}</p>`);
    server.close();
    c ? resolve(c) : reject(new Error(err ?? 'no code'));
  });
  server.listen(PORT, () => {
    console.log('\nOpening the Google consent screen…');
    console.log('If nothing opens, paste this into a browser:\n\n' + authUrl + '\n');
    execFile('open', [authUrl], () => {});
  });
});

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code, client_id: clientId, client_secret: clientSecret,
    redirect_uri: REDIRECT, grant_type: 'authorization_code',
  }),
});
const token = await tokenRes.json();
if (!token.refresh_token) {
  console.error('\nNo refresh token came back:', token);
  process.exit(1);
}
console.log('\nGot a refresh token. Verifying it can write to each folder…\n');

async function probe(label, folderId) {
  const boundary = 'probe' + Date.now();
  const meta = { name: `chara-probe-${Date.now()}.txt`, parents: [folderId] };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: text/plain\r\n\r\nconnectivity probe\r\n--${boundary}--`;
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  const out = await r.json();
  if (!r.ok) { console.log(`  FAIL  ${label} — ${out.error?.message ?? r.status}`); return false; }
  await fetch(`https://www.googleapis.com/drive/v3/files/${out.id}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token.access_token}` },
  });
  console.log(`  PASS  ${label} — wrote and cleaned up ${out.id}`);
  return true;
}

const results = [];
for (const [label, id] of Object.entries(FOLDERS)) results.push(await probe(label, id));

if (results.every(Boolean)) {
  console.log(`
All three folders are writable. Set these on Supabase:

  npx supabase secrets set \\
    GOOGLE_CLIENT_ID='${clientId}' \\
    GOOGLE_CLIENT_SECRET='${clientSecret}' \\
    GOOGLE_REFRESH_TOKEN='${token.refresh_token}' \\
    DRIVE_FOLDER_FORMS='${FOLDERS.forms}' \\
    DRIVE_FOLDER_RECEIPTS='${FOLDERS.receipts}'

Keep the refresh token out of the repo — it is a long-lived credential.
`);
} else {
  console.log(`
At least one folder was not writable with the drive.file scope.
Re-run with the broader scope by setting SCOPE to
  https://www.googleapis.com/auth/drive
in scripts/google-auth.mjs, and re-consent.
`);
}
process.exit(0);
