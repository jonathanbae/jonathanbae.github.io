# Chara Reimbursement Form

Web form for Chara EM reimbursement requests. Submitters file receipts; the finance
team reviews them and generates the church's Payment Request Form as a filled PDF.

Deployed to GitHub Pages at <https://jonathanbae.github.io/docs/>.

## Setup

1. `npm install`
2. `cp .env.example .env.local` and fill in `VITE_SUPABASE_ANON_KEY`
   (Supabase → Project Settings → API → anon/public key).
3. `npm run dev`

## Supabase

Run `supabase/schema.sql` in the SQL editor. Then, under Authentication → Users,
create the three shared logins and add a matching row to `public.profiles`:

| email | role |
|---|---|
| `finance.user@characommunity.org` | `user` |
| `finance.pastor@characommunity.org` | `pastor` |
| `finance.admin@characommunity.org` | `admin` |

These are identifiers, not mailboxes — nothing is ever sent, as long as you create
each user with **Auto Confirm User** checked. The domain must match
`VITE_LOGIN_DOMAIN` (default `characommunity.org`).

Also turn **off** Authentication → Providers → Email → "Allow new users to sign up".
Without that, anyone holding the anon key from the JS bundle could self-register and
read every request, since RLS grants reads to any authenticated session.

```sql
insert into public.profiles (id, email, role)
select id, email,
       case when email like 'finance.admin@%'  then 'admin'
            when email like 'finance.pastor@%' then 'pastor'
            else 'user' end
from auth.users
on conflict (id) do update set role = excluded.role;
```

## Layout

- `src/` — Vite + React app.
- `form/` — PDF fill engine and its calibration harness. See `form/README.md`.
- `supabase/schema.sql` — tables, RLS, seed categories, storage bucket.
- `PLAN.md` — the project plan and what is built vs. pending.

## Deploy

`npm run build` writes to `docs/`, which is what Pages serves. Commit `docs/`.
