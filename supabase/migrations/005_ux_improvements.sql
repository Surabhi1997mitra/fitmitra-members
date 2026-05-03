-- Add avatar_url to profiles table
alter table public.profiles add column if not exists avatar_url text;

-- Create progress_photos table
create table if not exists public.progress_photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.progress_photos enable row level security;

-- RLS Policy: Users can manage own progress photos
create policy "Users can manage own progress photos"
  on public.progress_photos for all using (auth.uid() = user_id);
