-- =============================================================================
-- NTPB Batcha — Schéma Supabase initial
-- Tables + Row Level Security (RLS)
-- À exécuter dans l'éditeur SQL du dashboard Supabase (SQL Editor).
-- =============================================================================

-- Extension pour générer des UUID (déjà présente sur les projets Supabase)
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table editions
-- -----------------------------------------------------------------------------
create table if not exists public.editions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  numero_edition integer not null,
  theme text,
  date_debut date,
  date_fin date,
  budget_cible numeric default 0,
  objectifs text,
  statut text default 'Planifiée',
  created_at timestamptz default now(),
  banner_image text,
  achieved_amount numeric default 0,
  vision text
);

-- Index pour accélérer les requêtes par propriétaire
create index if not exists editions_user_id_idx on public.editions (user_id);

-- -----------------------------------------------------------------------------
-- Table donations
-- -----------------------------------------------------------------------------
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  edition_id uuid references public.editions(id) on delete cascade,
  donor_type text,
  donor_name text,
  donor_phone text,
  date date,
  amount numeric default 0,
  payment_method text,
  is_nature boolean default false,
  nature_description text,
  status text default 'Reçu',
  receipt_number text,
  created_at timestamptz default now()
);

create index if not exists donations_user_id_idx on public.donations (user_id);
create index if not exists donations_edition_id_idx on public.donations (edition_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.editions enable row level security;
alter table public.donations enable row level security;

-- Chaque utilisateur ne peut lire/modifier/supprimer que ses propres éditions
create policy "editions_owner_all" on public.editions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Chaque utilisateur ne peut lire/modifier/supprimer que ses propres dons
create policy "donations_owner_all" on public.donations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);