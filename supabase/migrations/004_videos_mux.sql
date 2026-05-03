-- Add missing columns to videos
alter table public.videos add column if not exists mux_upload_id text;
alter table public.videos add column if not exists status text default 'uploading';

-- Seed categories (idempotent)
insert into public.categories (name) values
  ('Shoulders'), ('Chest'), ('Back'), ('Legs'),
  ('Core'), ('Full Body'), ('Cardio'), ('Mobility')
on conflict (name) do nothing;
