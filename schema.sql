-- =========================================================
-- ARQUITECTURA DE DATOS: MOLVA + TUNE TRACKER (SUPABASE)
-- =========================================================
-- Molva funciona como visualizador y repositorio discográfico
-- alimentado directamente por las playlists creadas en Tune Tracker.

-- 1. Tabla nativa de Tune Tracker para selecciones curadas
-- (Ya existente en Supabase PostgreSQL: public.spotitracker_curator)
create table if not exists public.spotitracker_curator (
  id text primary key default 'default',
  user_id text not null default 'Vrak_23',
  cycle_year text,
  cycle_half text,
  target_count integer default 18,
  selected_tracks jsonb default '[]'::jsonb,
  honorable_mentions jsonb default '[]'::jsonb,
  year_favorites jsonb default '[]'::jsonb,
  settings jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================
-- ESTRUCTURA DE PERSONALIZACIÓN DE MOLVA DENTRO DE SETTINGS:
-- =========================================================
-- Dentro de `settings.molva` se guardan las personalizaciones visuales:
-- {
--   "title": "All Of The Moons",
--   "slug": "all-of-the-moons",
--   "description": "Selección curada semestral...",
--   "story": "Liner Notes / Memoria conceptual...",
--   "cover_url": "data:image/webp;base64,... o URL",
--   "dominant_color": "#3b1d28",
--   "release_date": "2026-11-12",
--   "release_type": "Semestral",
--   "catalog_number": "TT-2026-02",
--   "spotify_url": "https://open.spotify.com/playlist/...",
--   "youtube_url": "https://music.youtube.com/playlist/...",
--   "tags": ["TUNE TRACKER", "METAL", "ROCK"],
--   "creator_name": "Vrak23",
--   "creator_avatar": "",
--   "trackNotes": {
--     "spotify:track:...": "Nota personalizada para este tema"
--   }
-- }

-- Habilitar RLS público para lectura y escritura desde la aplicación
alter table public.spotitracker_curator enable row level security;

create policy "Lectura pública spotitracker_curator" 
  on public.spotitracker_curator for select 
  using (true);

create policy "Gestión pública spotitracker_curator" 
  on public.spotitracker_curator for all 
  using (true);
