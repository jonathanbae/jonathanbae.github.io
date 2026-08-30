# Chara Reimbursement Form — Project Plan

Replace the Angular drug-study site with a reimbursement request app.
**Priorities: (1) PDF accuracy, (2) no access without password.**

---

## 1. Stack (decided)

- **Frontend:** fresh Vite + React + TS in this repo; build output stays `docs/` for GitHub Pages.
- **Backend:** Supabase — Postgres (source of truth), Storage (receipt uploads), Auth, Edge Functions.
- **Google:** Edge Function w/ service-account key mirrors files → Drive. **Sheet is copy/paste for now** (no API append).
- **Auth:** 3 pre-created Supabase accounts (`admin@ / pastor@ / user@`), shared password per role.
- **PDF:** `pdf-lib` draws text at fixed coordinates (form has **no** AcroForm fields — confirmed). Output is **page 1 only**.
- **Future:** Firebase/subdomain move = swap host only; Supabase + app code unchanged.

---

## 2. Roles & states

| Role | Can |
|---|---|
| user | submit requests; re-open/edit own (looked up by submitter email) while `requested` |
| pastor | view all; approve — **not a gating step for now**, wired for future signature/pre-review |
| admin (finance) | view all, **override any field**, generate PDF, advance state |

**States:** `requested` (user submitted) → `reviewed` (finance filled + submitted the form) → `paid` (check received and handed back).

---

## 3. Data model (Postgres)

- `submitters` — email (pk), full_name, address *(saved on first submit, prefilled after)*
- `requests` — id, submitter_email, status(`requested|reviewed|paid`), payee_name, payee_address **(optional)**, requester_name, requested_date, education_dept(`Chara EM`), account_number(`6060|6070`), total_amount, form_pdf_path, drive_form_link, timestamps
- `line_items` — id, request_id, item_category **(nullable)**, code **(nullable)**, account_number **(nullable, default 6060)**, description **(required, ≤40/line)**, amount, spend_date, receipt_mode(`in_person|needs_printing`)
- `receipts` — id, line_item_id, storage_path, drive_link, mime, size_bytes
- `categories` — name, code
- `rate_limits` — actor, window_start, count
- `audit_log` — actor, action, request_id, payload, at

Categories seed (name → code; code is the Sheet `Code` column, **not** the PDF account number):
College Ministry 104 · Summer Retreat 109 · Winter Retreat 109 · Books & Study Material 105 · All Meetings & Gathering 102 · Members Meeting 107 · Praise Team Equipment 103 · Media Team Equipment 103 · Sports Ministry 106 · Worship Room Supplies 108 · Communion 103 · Pastor's Training 103 · Welcoming Team 103 · Outreach Ministry 106 · Life Groups 104 · Creative Team 103 · Men's Ministry 106 · Women's Ministry 106 · Mental Health Support 110 · Book Club 106 · Missions 111

---

## 4. Screens

1. **Login** — role + password. Nothing else reachable unlogged.
2. **New request** — submitter email, payee name, address (optional — fills the saved one if blank); repeatable line-item rows: spend date, amount, description, receipt mode (`in person` / `needs printing` + file upload).
   - **Category / code / account number are optional for submitters.** Inline guidance: *"Not sure which category? Leave it blank and write a clear description — the finance team will fill it in."*
   - Description is the field that must be good: prefilled hint `<Category> - <Store>`, e.g. `Members Meeting - Walmart`. Required, ≤40 chars per line.
   - Blank category renders as a flagged "needs category" chip in the admin queue.
3. **View existing** — enter email → list own requests → open → edit while `requested`.
4. **Admin queue** — all requests, filter by status, **checkbox multi-select** for bulk TSV copy.
5. **Admin detail** — **every field editable/overridable**, incl. category, code, account number, amounts, totals. This is where submitter ambiguity gets resolved; nothing blocks submission on it. Enter requester name + requested date → **Preview PDF** → Generate → `reviewed` (PDF + receipts pushed to Drive). Later: mark `paid`.
   - **Copy Sheet rows** → grouped TSV (see §6). Works on one request or a multi-select of many.

---

## 5. PDF fill map (page 1 only, 612x792, origin bottom-left)

Verified against a hand-filled sample. Coordinates still need one calibration pass.

| Field | Source | Approx anchor |
|---|---|---|
| Education Dept. Name | literal `CHARA EM` (2 lines) | x~130, y~672 / y~658 |
| Line rows (**4 max**) | line_items | Description x~112, Acct# x~250, Name of Acct x~358, Amount x~470; rows y~580 -> 470 |
| Account Number (per row) | `6060` always; `6070` **only** for the EM Retreat; admin-overridable | — |
| **Name of Account (per row)** | **the numeric code** (102-111) — *not* the category name; must be resolved by admin before generate | — |
| Description (per row) | 2 lines: `<Category>` / indented `<Vendor>` | <=40 chars per line |
| Amount (per row) | bare number, **no `$`** | right-aligned |
| Total Amount | sum of rows | x~465, y~467 (after preprinted `$`) |
| Payment Method | always X **Check** | box x~120, y~467 |
| Receipt | always X **Attached** | box x~93, y~397 |
| Payee | submitter name | x~145, y~371 |
| Address | optional; blank if unknown | x~145, y~357 |
| Name of Requester | entered at generate time | x~130, y~331 |
| Requested Date | `M/D/YY` written across the slots | x~462, y~331 (**cover preprinted "20 20"**) |
| Signatures / Official Use / cash rows | left blank (wet signature) | — |

- Page 2 (church-wide code table) is **dropped** from the generated PDF.
- All values ASCII -> Helvetica; no Korean font embedding.
- **>4 line items => split into 2+ standalone forms** (4 items each). Each form is self-contained: its own payee/requester header and its own Total. Filenames get `-1of2`, `-2of2`; all forms share one request id and the same Expense Link set.

## 6. Google Drive

Service account, files written into existing folders:

- root `19slSTc9Zn1p4S5SClInmdKOsrqaaMLBr`
- expense forms `1iK543scU7xKkEzkNIA0xUc0_gGgdaS73`
- receipts `1dXdRFMiXW1S9UxDKC9XMkvU8iJtlWe0R`

Naming: `<YYYY-MM>-<payee>-<request-id>.pdf`; receipts `…-r<n>.<ext>`. Store returned Drive links on the row.

**Sheet:** manual paste. Admin UI emits TSV, columns:
`Name | Date | Amount | Item | Code | Description | Receipt Link | Expense Link`

Row grouping (fewest rows that stay correct):
- Group a request's line items **by `Code`** — one output row per distinct code. Different codes cannot share a row.
- `Amount` = sum of the group. `Item` = distinct category names, comma-joined. `Description` = each line item's description, newline-joined. `Receipt Link` = newline-joined. `Date` = the shared spend date, else the earliest.
- `Expense Link` = the generated form PDF (same for every row from one request).

**Multi-select:** admin queue supports checkbox-selecting many requests -> one Copy that emits all their grouped rows together, sorted by date.

---

## 7. Security

- Shared role accounts mean `auth.email()` is **not** a person. Accepted tradeoff: the password is the real boundary; the submitter email is a *lookup key, not an authorization check*. Anyone logged in as `user` could pull up another submitter's request by guessing their email — acceptable within a ministry team, noted here so it isn't a surprise.
- RLS default-deny on every table; reads/writes require an authenticated session; destructive ops (status change, override, delete) require `admin` claim.
- Storage bucket **private**; access only via short-lived signed URLs.
- Edge Functions verify JWT + role server-side; Drive credentials never leave the server.
- Rate limits: Supabase Auth login throttle + per-session submit cap (e.g. 10/hr) + per-IP in the function; Turnstile on login if abuse appears.
- Upload validation: mime allowlist (pdf/jpg/png/heic), ≤10 MB, count cap per request.
- Client bundle holds only the Supabase anon key (safe under RLS).
- `audit_log` on every status change and admin override.

---

## 8. Workstreams (parallelizable)

**A. Supabase** — project, schema + RLS, seed categories, 3 auth users, storage bucket, rate-limit fn.
**B. Frontend shell** — strip Angular app, Vite+React scaffold, router, auth guard, GH Pages build to `docs/` + 404.html.
**C. Forms** — new-request form, line-item repeater, uploads, view/edit-by-email.
**D. PDF engine** — `pdf-lib` fill + coordinate map + calibration harness (render → visually diff). *Highest-risk, start early.*
**E. Drive sync** — service account, Edge Function `finalize-request`.
**F. Admin UI** — queue, detail w/ full override, preview, generate, TSV copy, mark paid.

Dependencies: A→C/F, D independent, E after A.

---

## 9. Phases

1. **P0 Spike** — D calibration: hand-fill one PDF from fake data, eyeball against a real filled form. Gate on accuracy.
2. **P1 Skeleton** — A + B: login works, nothing reachable without it.
3. **P2 Submit** — C: submit w/ receipts, stored in Supabase.
4. **P3 Admin** — F + D: override + generate → correct PDF downloads, TSV copy.
5. **P4 Drive** — E: PDF + receipts land in the three folders.
6. **P5 Harden** — rate limits, audit log, edit-lock rules, deploy.

---

## 10. Still needed

- Share the three Drive folders with the service-account email (generated in P4).
- Passwords for the three role accounts.

---

## 11. Status

| Phase | State |
|---|---|
| P0 PDF spike | **done** — calibrated against the hand-filled scan |
| P1 Skeleton | **done** — login, guards, RLS verified |
| P2 Submit | **done** — verified end-to-end against the real project |
| P3 Admin | **code done**, needs a run-through in the browser |
| P4 Drive | not started |
| P5 Harden | not started |

Built so far: the PDF fill engine (`src/form/`, single source shared by the browser
and the Node calibration harness) plus `form/calibrate.mjs`; `supabase/schema.sql`;
the Vite+React app — role login, route guards, left-hand nav, submission form,
email lookup with editing, and the finance queue with full override, PDF preview /
generate, and grouped TSV copy. `npm test` covers the sheet-row grouping rules.
GitHub Pages build to `docs/` with SPA 404 fallback.
The Angular study app was removed — it remains in git history at `7c37e57`.

Deferred to P4: Receipt Link and Expense Link in the TSV stay blank, because the
only URLs available today are short-lived signed links that would rot inside a
permanent spreadsheet. Drive gives them stable hrefs.
