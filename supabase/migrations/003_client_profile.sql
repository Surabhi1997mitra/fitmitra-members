-- Create client_profile table
create table if not exists public.client_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  -- Step 1: Personal Details
  full_name text,
  age integer,
  gender text,
  date_of_birth date,
  phone text,
  email text,
  city text,
  state text,
  pincode text,

  -- Step 2: Body Stats
  height numeric,
  weight numeric,
  target_weight numeric,
  body_type text,

  -- Step 3: Goals
  primary_goal text,
  secondary_goal text,
  goal_timeline text,
  motivation text,

  -- Step 4: Health & Medical
  medical_conditions text,
  injuries text,
  medications text,
  surgeries text,
  blood_reports text,

  -- Step 5: Fitness Background
  activity_level text,
  fitness_experience text,
  workout_type text,
  workout_days integer,
  workout_duration text,
  equipment_available text,

  -- Step 6: Diet & Nutrition
  dietary_preference text,
  allergies text,
  meals_per_day integer,
  water_intake text,
  supplements text,
  alcohol_consumption text,

  -- Step 7: Lifestyle & Recovery
  occupation text,
  work_hours integer,
  sleep_hours numeric,
  stress_level text,
  smoking_status text,

  -- Step 8: Body Measurements (all optional)
  chest_measurement numeric,
  waist_measurement numeric,
  hips_measurement numeric,
  arms_measurement numeric,
  thighs_measurement numeric,

  -- Step 9: Tracking Preferences
  tracking_method text,
  checkin_frequency text,
  additional_notes text,

  -- Metadata
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.client_profile enable row level security;

-- Users can read their own profile
drop policy if exists "Users can read own profile" on public.client_profile;
create policy "Users can read own profile"
  on public.client_profile for select
  using (auth.uid() = user_id);

-- Users can insert their own profile
drop policy if exists "Users can insert own profile" on public.client_profile;
create policy "Users can insert own profile"
  on public.client_profile for insert
  with check (auth.uid() = user_id);

-- Users can update their own profile
drop policy if exists "Users can update own profile" on public.client_profile;
create policy "Users can update own profile"
  on public.client_profile for update
  using (auth.uid() = user_id);

-- Admins can read all profiles
drop policy if exists "Admins can read all profiles" on public.client_profile;
create policy "Admins can read all profiles"
  on public.client_profile for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.is_admin = true
    )
  );
