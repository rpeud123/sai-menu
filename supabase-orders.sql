-- SAI WEB V2.6 주문 시스템
-- Supabase Dashboard → SQL Editor에서 전체 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  table_no integer not null check (table_no between 1 and 99),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  total_amount integer not null check (total_amount >= 0),
  note text not null default '' check (char_length(note) <= 200),
  status text not null default 'new' check (status in ('new','accepted','making','ready','served','cancelled')),
  device_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.staff_emails enable row level security;

-- 손님: 주문 생성만 허용
drop policy if exists "customers can create orders" on public.orders;
create policy "customers can create orders"
on public.orders for insert
to anon, authenticated
with check (
  table_no between 1 and 99
  and status = 'new'
  and total_amount >= 0
  and jsonb_array_length(items) between 1 and 30
);

-- 직원: allowlist 이메일만 주문 열람
drop policy if exists "staff can read orders" on public.orders;
create policy "staff can read orders"
on public.orders for select
to authenticated
using (
  exists (
    select 1 from public.staff_emails s
    where lower(s.email) = lower(auth.jwt() ->> 'email')
  )
);

-- 직원: 주문 상태 변경
drop policy if exists "staff can update orders" on public.orders;
create policy "staff can update orders"
on public.orders for update
to authenticated
using (
  exists (
    select 1 from public.staff_emails s
    where lower(s.email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  exists (
    select 1 from public.staff_emails s
    where lower(s.email) = lower(auth.jwt() ->> 'email')
  )
);

-- 직원 이메일 테이블은 서비스 관리자(SQL Editor)만 수정
revoke all on public.staff_emails from anon, authenticated;
grant select, insert on public.orders to anon, authenticated;
grant update on public.orders to authenticated;

-- Realtime 활성화
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
end $$;

-- 아래 이메일을 실제 직원 이메일로 바꿔 실행하세요.
-- insert into public.staff_emails(email) values ('staff@example.com')
-- on conflict (email) do nothing;
