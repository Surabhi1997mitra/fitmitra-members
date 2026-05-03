-- Add email column to profiles table
alter table public.profiles add column if not exists email text;

-- Create a security definer function to check if user is admin (bypasses RLS recursion)
create or replace function public.is_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and is_admin = true
  );
$$;

-- RLS policy: Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_user_admin());

-- RLS policy: Admins can update all profiles
create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_user_admin());

-- RLS policy: Admins can read all categories
create policy "Admins can read all categories"
  on public.categories for select
  using (public.is_user_admin());

-- RLS policy: Admins can read all videos
create policy "Admins can read all videos"
  on public.videos for select
  using (public.is_user_admin());
