-- Chara Reimbursement Form — schema, RLS and seed data.
-- Paste into the Supabase SQL editor. Safe to re-run.

-- ---------------------------------------------------------------- roles
-- Three shared logins (admin@ / pastor@ / user@) are created in the Auth
-- dashboard; this table carries the role. It is NOT client-writable, so a
-- signed-in "user" cannot promote themselves to admin.
create table if not exists public.profiles (
  id    uuid primary key references auth.users on delete cascade,
  email text not null,
  role  text not null check (role in ('admin','pastor','user'))
);

create or replace function public.role_of(uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = uid
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.role_of(auth.uid()) = 'admin'
$$;

create or replace function public.is_staff()
returns boolean language sql stable as $$
  select public.role_of(auth.uid()) in ('admin','pastor')
$$;

-- ---------------------------------------------------------------- reference
create table if not exists public.categories (
  name text primary key,
  code text not null
);

insert into public.categories (name, code) values
  ('College Ministry','104'), ('Summer Retreat','109'), ('Winter Retreat','109'),
  ('Books & Study Material','105'), ('All Meetings & Gathering','102'),
  ('Members Meeting','107'), ('Praise Team Equipment','103'),
  ('Media Team Equipment','103'), ('Sports Ministry','106'),
  ('Worship Room Supplies','108'), ('Communion','103'), ('Pastor''s Training','103'),
  ('Welcoming Team','103'), ('Outreach Ministry','106'), ('Life Groups','104'),
  ('Creative Team','103'), ('Men''s Ministry','106'), ('Women''s Ministry','106'),
  ('Mental Health Support','110'), ('Book Club','106'), ('Missions','111')
on conflict (name) do update set code = excluded.code;

-- Remembered payee details. Filled on a submitter's first request, prefilled after.
create table if not exists public.submitters (
  email      text primary key,
  full_name  text,
  address    text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- requests
create table if not exists public.requests (
  id               uuid primary key default gen_random_uuid(),
  submitter_email  text not null,
  status           text not null default 'requested'
                     check (status in ('requested','reviewed','paid')),
  payee_name       text not null,
  payee_address    text,                      -- optional
  requester_name   text,                      -- entered by finance at generate time
  requested_date   date,
  education_dept   text not null default 'Chara EM',
  form_pdf_paths   text[] not null default '{}',
  drive_form_links text[] not null default '{}',
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists requests_email_idx  on public.requests (lower(submitter_email));
create index if not exists requests_status_idx on public.requests (status, created_at desc);

-- Category / code / account_number are nullable on purpose: submitters may leave
-- them blank when unsure, and finance resolves them during review.
create table if not exists public.line_items (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references public.requests on delete cascade,
  position       int  not null default 0,
  item_category  text references public.categories(name),
  code           text,
  account_number text default '6060' check (account_number in ('6060','6070')),
  description    text not null check (char_length(description) <= 40),
  vendor         text,
  amount         numeric(10,2) not null check (amount > 0),
  spend_date     date not null,
  receipt_mode   text not null check (receipt_mode in ('in_person','needs_printing'))
);
create index if not exists line_items_request_idx on public.line_items (request_id, position);

create table if not exists public.receipts (
  id           uuid primary key default gen_random_uuid(),
  line_item_id uuid not null references public.line_items on delete cascade,
  storage_path text not null,
  drive_link   text,
  mime         text,
  size_bytes   int,
  created_at   timestamptz not null default now()
);

create table if not exists public.audit_log (
  id         bigserial primary key,
  actor      text,
  action     text not null,
  request_id uuid,
  payload    jsonb,
  at         timestamptz not null default now()
);

-- Server-side only; no client policy is granted, so it is unreachable with the anon key.
create table if not exists public.rate_limits (
  actor        text not null,
  window_start timestamptz not null,
  count        int not null default 1,
  primary key (actor, window_start)
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists requests_touch on public.requests;
create trigger requests_touch before update on public.requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- RLS
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.submitters  enable row level security;
alter table public.requests    enable row level security;
alter table public.line_items  enable row level security;
alter table public.receipts    enable row level security;
alter table public.audit_log   enable row level security;
alter table public.rate_limits enable row level security;   -- no policies == deny all

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select to authenticated using (true);

drop policy if exists submitters_rw on public.submitters;
create policy submitters_rw on public.submitters for all to authenticated using (true) with check (true);

-- Everyone signed in may read and file requests. Because the three logins are
-- SHARED, auth.uid() identifies a role, not a person — submitter_email is a
-- lookup key, not an ownership check. The password is the real boundary.
drop policy if exists requests_read on public.requests;
create policy requests_read on public.requests for select to authenticated using (true);

drop policy if exists requests_insert on public.requests;
create policy requests_insert on public.requests for insert to authenticated
  with check (status = 'requested');

-- Editable by anyone while still 'requested'; once finance has touched it, admin only.
drop policy if exists requests_update on public.requests;
create policy requests_update on public.requests for update to authenticated
  using (status = 'requested' or public.is_admin())
  with check (public.is_admin() or status = 'requested');

drop policy if exists requests_delete on public.requests;
create policy requests_delete on public.requests for delete to authenticated using (public.is_admin());

create or replace function public.request_open(rid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.requests r
                 where r.id = rid and (r.status = 'requested' or public.is_admin()))
$$;

drop policy if exists line_items_read on public.line_items;
create policy line_items_read on public.line_items for select to authenticated using (true);
drop policy if exists line_items_write on public.line_items;
create policy line_items_write on public.line_items for all to authenticated
  using (public.request_open(request_id)) with check (public.request_open(request_id));

drop policy if exists receipts_read on public.receipts;
create policy receipts_read on public.receipts for select to authenticated using (true);
drop policy if exists receipts_write on public.receipts;
create policy receipts_write on public.receipts for all to authenticated
  using (exists (select 1 from public.line_items li
                 where li.id = line_item_id and public.request_open(li.request_id)))
  with check (exists (select 1 from public.line_items li
                 where li.id = line_item_id and public.request_open(li.request_id)));

drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log for insert to authenticated with check (true);
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated using (public.is_staff());

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public) values ('receipts','receipts',false)
on conflict (id) do nothing;

drop policy if exists receipts_bucket_read on storage.objects;
create policy receipts_bucket_read on storage.objects for select to authenticated
  using (bucket_id = 'receipts');

drop policy if exists receipts_bucket_write on storage.objects;
create policy receipts_bucket_write on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts');

drop policy if exists receipts_bucket_admin on storage.objects;
create policy receipts_bucket_admin on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and public.is_admin());
