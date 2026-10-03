-- CRAFTKIT Studio Supabase schema
-- Run this whole file in Supabase Dashboard > SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tag text not null,
  title text not null unique,
  description text not null default '',
  image text not null default '',
  price numeric(10,2) not null check (price >= 0),
  editable boolean not null default true,
  file_name text not null default '',
  file_data text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  level text not null default 'Beginner',
  lessons text not null default '',
  price numeric(10,2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  items jsonb not null,
  total numeric(10,2) not null check (total >= 0),
  payment_method text not null default 'demo',
  status text not null default 'demo',
  created_at timestamptz not null default now()
);

create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_title text not null,
  progress_value integer not null default 0 check (progress_value between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (user_id, course_title)
);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);
create index if not exists course_progress_user_updated_idx
  on public.course_progress (user_id, updated_at desc);

create or replace function public.handle_new_craftkit_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_craftkit_user_created on auth.users;
create trigger on_craftkit_user_created
after insert on auth.users
for each row execute procedure public.handle_new_craftkit_user();

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

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select on public.products, public.courses to anon, authenticated;
grant insert, update, delete on public.products, public.courses to authenticated;
grant select, insert on public.orders to authenticated;
grant select, insert, update on public.course_progress to authenticated;

drop policy if exists "profile owner reads profile" on public.profiles;
create policy "profile owner reads profile" on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles
for select to authenticated
using (public.is_craftkit_admin());

drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles" on public.profiles
for update to authenticated
using (public.is_craftkit_admin())
with check (public.is_craftkit_admin());

drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
for select to anon, authenticated
using (is_active = true);

drop policy if exists "admins insert products" on public.products;
create policy "admins insert products" on public.products
for insert to authenticated
with check (public.is_craftkit_admin());

drop policy if exists "admins update products" on public.products;
create policy "admins update products" on public.products
for update to authenticated
using (public.is_craftkit_admin())
with check (public.is_craftkit_admin());

drop policy if exists "admins delete products" on public.products;
create policy "admins delete products" on public.products
for delete to authenticated
using (public.is_craftkit_admin());

drop policy if exists "public reads active courses" on public.courses;
create policy "public reads active courses" on public.courses
for select to anon, authenticated
using (is_active = true);

drop policy if exists "admins insert courses" on public.courses;
create policy "admins insert courses" on public.courses
for insert to authenticated
with check (public.is_craftkit_admin());

drop policy if exists "admins update courses" on public.courses;
create policy "admins update courses" on public.courses
for update to authenticated
using (public.is_craftkit_admin())
with check (public.is_craftkit_admin());

drop policy if exists "admins delete courses" on public.courses;
create policy "admins delete courses" on public.courses
for delete to authenticated
using (public.is_craftkit_admin());

drop policy if exists "owners read orders" on public.orders;
create policy "owners read orders" on public.orders
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "admins read all orders" on public.orders;
create policy "admins read all orders" on public.orders
for select to authenticated
using (public.is_craftkit_admin());

drop policy if exists "owners create orders" on public.orders;
create policy "owners create orders" on public.orders
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "owners read course progress" on public.course_progress;
create policy "owners read course progress" on public.course_progress
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "admins read all course progress" on public.course_progress;
create policy "admins read all course progress" on public.course_progress
for select to authenticated
using (public.is_craftkit_admin());

drop policy if exists "owners create course progress" on public.course_progress;
create policy "owners create course progress" on public.course_progress
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "owners update course progress" on public.course_progress;
create policy "owners update course progress" on public.course_progress
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into public.products (tag, title, description, image, price, editable)
values
  ('CV', 'Executive Resume Kit', 'A polished resume package for professionals, recruiters, and career switchers.', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80', 10, true),
  ('Portfolio', 'Minimal Portfolio Pack', 'Elegant portfolio templates for designers, creatives, and developers.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80', 11, true),
  ('Poster', 'Campaign Poster Set', 'High-impact promotional posters for launches, events, and campaigns.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80', 9, true),
  ('Cards', 'Brand Card Bundle', 'Business cards, contact cards, and social-ready brand assets.', 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80', 11, true),
  ('CV', 'CV Template 01 · Executive Navy', 'A refined two-column CV with a strong professional profile and clear experience timeline.', 'assets/cv1.png', 10, true),
  ('CV', 'CV Template 02 · Graduate Teal', 'A fresh graduate layout designed to bring education, internships, and early-career skills forward.', 'assets/cv2.png', 10, true),
  ('CV', 'CV Template 03 · Modern Monochrome', 'A high-contrast editorial CV with room for a concise profile and detailed work history.', 'assets/cv3.png', 10, true),
  ('CV', 'CV Template 04 · Gold Accent', 'A bold, structured layout for marketing, management, and client-facing careers.', 'assets/cv4.png', 10, true),
  ('CV', 'CV Template 05 · Teal Creative', 'A creative CV design with clear sections for education, projects, and visual skills.', 'assets/cv5.png', 10, true),
  ('CV', 'CV Template 06 · Royal Blue', 'A confident blue layout for technical specialists and experienced professionals.', 'assets/cv6.png', 10, true),
  ('CV', 'CV Template 07 · Forest Editorial', 'A premium editorial look with balanced profile, education, and career sections.', 'assets/cv7.png', 10, true),
  ('CV', 'CV Template 08 · Minimal Teal', 'A clean contemporary CV focused on readable content and a strong visual hierarchy.', 'assets/cv8.png', 10, true),
  ('CV', 'CV Template 09 · Warm Minimal', 'An understated warm-toned design for creative and professional roles.', 'assets/cv9.png', 10, true),
  ('CV', 'CV Template 10 · Classic Blue', 'A polished classic layout with strong contrast and practical section spacing.', 'assets/cv10.png', 10, true)
on conflict (title) do nothing;

update public.products
set is_active = false
where title = 'Executive Resume Kit';

insert into public.courses (title, level, lessons, price)
values
  ('Graphic Design Fundamentals', 'Beginner', '18 lessons', 49),
  ('HTML & CSS for Creatives', 'Intermediate', '22 lessons', 59),
  ('Portfolio Building That Sells', 'Advanced', '14 lessons', 69)
on conflict (title) do nothing;

-- After your first sign-up, promote your account to catalog admin once:
-- update public.profiles set is_admin = true where email = 'you@example.com';
