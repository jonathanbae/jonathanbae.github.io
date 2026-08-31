-- Chara Reimbursement — server-side limits.
-- Run after schema.sql. Safe to re-run.
--
-- Everything here is enforced by Postgres, not the browser. The app applies the
-- same rules for good error messages, but a caller wielding the anon key
-- directly is still bound by these.

-- ---------------------------------------------------------------- uploads
-- Caps every object in the bucket at 10 MB and restricts the file types,
-- regardless of what the client claims.
update storage.buckets
   set file_size_limit = 10485760,          -- 10 MB
       allowed_mime_types = array[
         'application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'
       ]
 where id = 'receipts';

-- ---------------------------------------------------------------- rate limits
-- Shared role logins mean we cannot rate-limit per person, so we limit per
-- submitter email and put a ceiling on the whole form.
create or replace function public.enforce_request_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  from_email int;
  overall    int;
begin
  select count(*) into from_email
    from public.requests
   where lower(submitter_email) = lower(new.submitter_email)
     and created_at > now() - interval '1 hour';
  if from_email >= 10 then
    raise exception 'That email has submitted 10 requests in the past hour. Please try again later.'
      using errcode = 'check_violation';
  end if;

  select count(*) into overall
    from public.requests
   where created_at > now() - interval '1 hour';
  if overall >= 100 then
    raise exception 'The form is receiving an unusual number of submissions. Please try again later.'
      using errcode = 'check_violation';
  end if;

  return new;
end $$;

drop trigger if exists requests_rate_limit on public.requests;
create trigger requests_rate_limit
  before insert on public.requests
  for each row execute function public.enforce_request_rate_limit();

-- ---------------------------------------------------------------- size caps
-- A request is a stack of receipts, not a data dump. These bound how much one
-- submission can create.
create or replace function public.enforce_line_item_cap()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.line_items where request_id = new.request_id) >= 40 then
    raise exception 'A request cannot hold more than 40 receipts. Please split it up.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists line_items_cap on public.line_items;
create trigger line_items_cap
  before insert on public.line_items
  for each row execute function public.enforce_line_item_cap();

create or replace function public.enforce_receipt_cap()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.receipts where line_item_id = new.line_item_id) >= 10 then
    raise exception 'A receipt line cannot hold more than 10 files.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists receipts_cap on public.receipts;
create trigger receipts_cap
  before insert on public.receipts
  for each row execute function public.enforce_receipt_cap();

-- ---------------------------------------------------------------- signatures
-- Only the pastor login may add or alter a signature. Admins may edit every
-- other field on a request, but signing is not theirs to do — and the UI hiding
-- the button is not a control, so it is enforced here.
create or replace function public.enforce_pastor_signature()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.pastor_signature is distinct from old.pastor_signature
      or new.pastor_name    is distinct from old.pastor_name
      or new.pastor_signed_at is distinct from old.pastor_signed_at)
     and auth.uid() is not null
     and public.role_of(auth.uid()) is distinct from 'pastor'
  then
    raise exception 'Only the pastor login may sign a request.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

drop trigger if exists requests_pastor_signature on public.requests;
create trigger requests_pastor_signature
  before update on public.requests
  for each row execute function public.enforce_pastor_signature();

-- ---------------------------------------------------------------- integrity
-- Amounts must be sane: positive is already checked, this bounds the top end so
-- a fat-fingered entry cannot silently become a five-figure claim.
alter table public.line_items drop constraint if exists line_items_amount_ceiling;
alter table public.line_items add constraint line_items_amount_ceiling
  check (amount <= 100000);

-- Audit rows are append-only for everyone; nobody may rewrite history.
drop policy if exists audit_no_update on public.audit_log;
drop policy if exists audit_no_delete on public.audit_log;
revoke update, delete on public.audit_log from authenticated, anon;

-- An audit row with no actor is nearly worthless, and the app silently wrote
-- NULLs for every admin action until this was caught. Make that impossible.
update public.audit_log set actor = 'admin (unnamed)' where actor is null;
alter table public.audit_log alter column actor set default 'unknown';
alter table public.audit_log alter column actor set not null;
