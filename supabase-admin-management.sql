-- CRAFTKIT admin visibility and management policies
-- Run in Supabase SQL Editor after the base tables exist.
-- Then promote your first admin account using the UPDATE statement at the bottom.

create or replace function public.is_craftkit_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.courses enable row level security;
alter table public.orders enable row level security;
alter table public.course_progress enable row level security;

grant select, update on public.profiles to authenticated;
grant select on public.products, public.courses to anon, authenticated;
grant insert, update, delete on public.products, public.courses to authenticated;
grant select, insert on public.orders to authenticated;
grant select, insert, update on public.course_progress to authenticated;

drop policy if exists "profile owner reads profile" on public.profiles;
create policy "profile owner reads profile" on public.profiles
for select to authenticated using (id = auth.uid());
drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles
for select to authenticated using (public.is_craftkit_admin());
drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles" on public.profiles
for update to authenticated
using (public.is_craftkit_admin())
with check (public.is_craftkit_admin());

drop policy if exists "admins insert products" on public.products;
create policy "admins insert products" on public.products
for insert to authenticated with check (public.is_craftkit_admin());
drop policy if exists "admins update products" on public.products;
create policy "admins update products" on public.products
for update to authenticated
using (public.is_craftkit_admin()) with check (public.is_craftkit_admin());
drop policy if exists "admins delete products" on public.products;
create policy "admins delete products" on public.products
for delete to authenticated using (public.is_craftkit_admin());

drop policy if exists "admins insert courses" on public.courses;
create policy "admins insert courses" on public.courses
for insert to authenticated with check (public.is_craftkit_admin());
drop policy if exists "admins update courses" on public.courses;
create policy "admins update courses" on public.courses
for update to authenticated
using (public.is_craftkit_admin()) with check (public.is_craftkit_admin());
drop policy if exists "admins delete courses" on public.courses;
create policy "admins delete courses" on public.courses
for delete to authenticated using (public.is_craftkit_admin());

drop policy if exists "admins read all orders" on public.orders;
create policy "admins read all orders" on public.orders
for select to authenticated using (public.is_craftkit_admin());
drop policy if exists "admins read all course progress" on public.course_progress;
create policy "admins read all course progress" on public.course_progress
for select to authenticated using (public.is_craftkit_admin());

-- Run once in SQL Editor after creating your CRAFTKIT account. Replace the email.
-- update public.profiles set is_admin = true where email = 'you@example.com';
