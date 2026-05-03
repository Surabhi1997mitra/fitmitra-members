-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean default false,
  access_expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

-- Create videos table
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  tags text[] default array[]::text[],
  mux_asset_id text,
  mux_playback_id text,
  thumbnail_url text,
  duration integer,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.videos enable row level security;

-- Profiles RLS policies
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Categories RLS policies
create policy "Authenticated users with active access can read categories"
  on public.categories for select
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and is_active = true
      and access_expires_at > now()
    )
  );

create policy "Only admins can insert categories"
  on public.categories for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and is_admin = true
    )
  );

create policy "Only admins can update categories"
  on public.categories for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and is_admin = true
    )
  );

create policy "Only admins can delete categories"
  on public.categories for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and is_admin = true
    )
  );

-- Videos RLS policies
create policy "Authenticated users with active access can read videos"
  on public.videos for select
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and is_active = true
      and access_expires_at > now()
    )
  );

create policy "Only admins can insert videos"
  on public.videos for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and is_admin = true
    )
  );

create policy "Only admins can update videos"
  on public.videos for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and is_admin = true
    )
  );

create policy "Only admins can delete videos"
  on public.videos for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and is_admin = true
    )
  );
