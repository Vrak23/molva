-- =========================================================
-- ESQUEMA DE BASE DE DATOS PARA REPOSITORIO CANON (LANZAMIENTOS)
-- =========================================================

create extension if not exists "uuid-ossp";

-- 1. Tabla de Perfiles de Usuario
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  display_name text,
  email text,
  bio text,
  avatar_url text,
  spotify_url text,
  lastfm_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Playlists (Lanzamientos tipo Álbum)
create table if not exists playlists (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  description text,
  story text, -- Liner Notes / Historia
  cover_url text,
  dominant_color text default '#262626',
  spotify_url text,
  youtube_url text,
  tags text[] default '{}',
  
  -- Atributos de Lanzamiento
  release_date text default to_char(now(), 'YYYY-MM-DD'),
  release_type text default 'LP',
  catalog_number text,
  
  -- Creador
  creator_username text not null,
  creator_name text,
  creator_avatar text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de Canciones / Tracks
create table if not exists tracks (
  id uuid primary key default uuid_generate_v4(),
  playlist_id uuid references playlists(id) on delete cascade not null,
  position integer not null default 0,
  title text not null,
  artist text not null,
  duration_ms integer,
  notes text,
  spotify_track_id text,
  youtube_video_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices
create index if not exists idx_playlists_slug on playlists(slug);
create index if not exists idx_playlists_creator on playlists(creator_username);
create index if not exists idx_tracks_playlist_id on tracks(playlist_id);

-- Políticas RLS públicas
alter table profiles enable row level security;
alter table playlists enable row level security;
alter table tracks enable row level security;

create policy "Lectura pública de perfiles" on profiles for select using (true);
create policy "Lectura pública de playlists" on playlists for select using (true);
create policy "Lectura pública de tracks" on tracks for select using (true);

create policy "Gestión de perfiles" on profiles for all using (true);
create policy "Gestión de playlists" on playlists for all using (true);
create policy "Gestión de tracks" on tracks for all using (true);
