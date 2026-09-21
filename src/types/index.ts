export type ReleaseType = 'LP' | 'EP' | 'Mixtape' | 'Compilación' | 'Sesión';

export interface Track {
  id: string;
  playlist_id: string;
  position: number;
  title: string;
  artist: string;
  duration_ms?: number;
  notes?: string;
  spotify_track_id?: string;
  youtube_video_id?: string;
}

export interface Playlist {
  id: string;
  slug: string;
  title: string;
  description?: string;
  story?: string; // Liner notes / Historia del lanzamiento
  cover_url?: string;
  dominant_color?: string;
  spotify_url?: string;
  youtube_url?: string;
  tags?: string[];
  
  // Metadatos de Lanzamiento tipo Álbum
  release_date: string; // Fecha de creación / lanzamiento (YYYY-MM-DD o ISO)
  release_type: ReleaseType;
  catalog_number?: string;
  
  // Metadatos del Creador / Perfil
  creator_id?: string;
  creator_username: string;
  creator_name?: string;
  creator_avatar?: string;

  created_at: string;
  updated_at: string;
  tracks?: Track[];
}

export interface ImportPreviewTrack {
  position: number;
  title: string;
  artist: string;
  duration_ms?: number;
  notes?: string;
  spotify_track_id?: string;
  youtube_video_id?: string;
}

export interface ImportPreviewResult {
  title: string;
  description?: string;
  cover_url?: string;
  tracks: ImportPreviewTrack[];
  platform: 'spotify' | 'youtube' | 'unknown';
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
