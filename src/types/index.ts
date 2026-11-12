export type ReleaseType = 'Semestral' | 'LP' | 'EP' | 'Single' | 'Mixtape' | 'Compilación' | 'Sesión';

export interface Track {
  id: string;
  playlist_id: string;
  position: number;
  title: string;
  artist: string;
  album?: string;
  duration_ms?: number;
  notes?: string;
  plays?: number; // Streams acumulados en Tune Tracker
  uri?: string;
  spotify_track_id?: string;
  youtube_video_id?: string;
}

export interface Playlist {
  id: string;
  slug: string;
  title: string;
  description?: string;
  story?: string; // Liner notes / Memoria conceptual del lanzamiento
  cover_url?: string;
  dominant_color?: string;
  spotify_url?: string;
  youtube_url?: string;
  tags?: string[];
  
  // Metadatos de Lanzamiento tipo Álbum / Semestral
  release_date: string; // Fecha de creación / lanzamiento (YYYY-MM-DD o ISO)
  release_type: ReleaseType;
  catalog_number?: string;
  upcoming_album?: string;
  
  // Metadatos específicos de ciclo de Tune Tracker
  cycle_year?: string;
  cycle_half?: string;
  period_str?: string;
  target_count?: number;
  
  // Metadatos del Creador / Curador (Vrak23)
  creator_id?: string;
  creator_username: string;
  creator_name?: string;
  creator_avatar?: string;

  created_at: string;
  updated_at: string;
  tracks?: Track[];
}

export interface UserProfile {
  id?: string;
  username: string;
  displayName?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  spotifyUrl?: string;
  lastfmUrl?: string;
  joined_at?: string;
}
