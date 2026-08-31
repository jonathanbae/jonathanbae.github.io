# Security notes

## SQL injection

**Not reachable through any form field.** The app never composes SQL. Every read
and write goes through `supabase-js`, which sends values as JSON to PostgREST;
PostgREST binds them as parameters. A submitter typing
`'; drop table requests; --` into a description stores that as a 40-character
string and nothing more.

Audited, and re-checkable with the greps below:

| Vector | Finding |
|---|---|
| Raw filter strings (`.or()`, `.filter()`, `.textSearch()`) | not used — only column/operator/value forms like `.eq()`, `.in()`, `.is()` |
| Template interpolation inside a query call | none |
| Dynamic SQL (`EXECUTE`, `format()`) in our functions | none; the only `execute` hits are `EXECUTE FUNCTION` in trigger definitions, which is DDL we wrote |
| `SECURITY DEFINER` functions | 5, every one pinned with `SET search_path = public` so a hijacked `search_path` cannot redirect them |
| `.rpc()` | not used |
| Raw HTML (`dangerouslySetInnerHTML`, `innerHTML`, `eval`) | none — React escapes all interpolated text |

```sh
grep -rn "\.or(\|\.filter(\|\.textSearch(\|\.rpc(" src/          # raw filter strings
grep -rnE "\.(eq|in|is|like|ilike)\([^)]*\\\$\{" src/            # interpolation into filters
grep -rn "EXECUTE\|format(" supabase/                            # dynamic SQL
grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(" src/        # XSS
```

**Storage paths** are the one place a user-supplied string reaches a path.
`slug()` in `src/lib/api.ts` strips everything outside `[a-zA-Z0-9._-]`, so `/`
is removed and `../../etc` becomes `.._.._etc`. Each segment is also prefixed
with an index, so a segment can never be exactly `..`.

## What actually protects the data

Enforced in Postgres, not the browser — a caller wielding the anon key directly
is bound by all of it:

- **RLS default-deny** on every table. Unauthenticated reads return nothing.
- **Signup disabled**, so the only way to a session is a shared password.
- Status changes, deletes and overrides require the `admin` role, read from
  `public.profiles`, which has no client write policy.
- **Upload limits on the bucket itself**: 10 MB, and PDF/JPEG/PNG/HEIC only.
- **Rate limits as insert triggers**: 10 requests/hour per submitter email,
  100/hour overall.
- **Caps**: 40 line items per request, 10 files per line, $100,000 per amount.
- **Audit log is append-only** — `UPDATE`/`DELETE` revoked from all client roles —
  and `actor` is `NOT NULL`, so an action cannot be logged anonymously.

## Known, accepted weaknesses

These are design trade-offs, not oversights. Listed so they are not a surprise.

1. **Shared role passwords.** `auth.uid()` identifies a role, not a person. Any
   signed-in user can read every request, because RLS cannot distinguish people
   who share a login. The password is the real boundary.
2. **Submitter email is a lookup key, not an ownership check.** Anyone signed in
   can pull up another submitter's requests by guessing their email.
3. **The operator name is self-declared.** The admin/pastor name modal makes the
   audit log useful among people acting in good faith. It proves nothing. The
   name and the pastor's drawn signature live in `sessionStorage`, so closing
   the tab forgets both and the next person at a shared login is asked afresh —
   one pastor's signature is never reused for another's approvals.
4. **Sheet links are bearer credentials.** The 10-year signed URLs pasted into
   the tracker grant access to whoever holds them, like a Drive "anyone with the
   link" share. Rotating the project's JWT secret invalidates all of them.
5. **The pastor's signature is an image, not a cryptographic signature.** It is
   stored per request so later changes cannot alter past approvals, but anyone
   with the pastor login could draw it.
6. **"A receipt must be attached" is enforced in the app, not the database.**
   The constraint spans two tables, so a `CHECK` cannot express it. The admin
   gate blocks PDF generation when a file is missing.

Fixing 1–3 means per-person accounts. That is the upgrade path if this ever
needs real attribution.
