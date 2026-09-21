import { createClient } from '@supabase/supabase-js';
import { Playlist, Track, UserProfile } from '@/types';
import { INITIAL_MOCK_PLAYLISTS } from './mock-data';
import { getLocalPlaylists, saveLocalPlaylist, deleteLocalPlaylist } from './local-storage-db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Obtener todas las playlists / lanzamientos
export async function getPlaylists(): Promise<Playlist[]> {
  if (supabase) {
    const { data: playlists, error } = await supabase
      .from('playlists')
      .select('*, tracks(*)')
      .order('release_date', { ascending: false });

    if (!error && playlists && playlists.length > 0) {
      return playlists.map(p => ({
        ...p,
        tracks: (p.tracks || []).sort((a: Track, b: Track) => a.position - b.position)
      }));
    }
  }

  // Fallback a IndexedDB (sin límite de 5MB)
  if (typeof window !== 'undefined') {
    return getLocalPlaylists();
  }

  return INITIAL_MOCK_PLAYLISTS;
}

export function isUserCreator(playlistCreator?: string, currentUsername?: string): boolean {
  if (!currentUsername) return false;
  const curr = currentUsername.toLowerCase();
  const creator = (playlistCreator || '').toLowerCase();
  
  if (creator === curr) return true;
  
  // Reclamar/vincular automáticamente los lanzamientos creados anteriormente en local por Rodrigo / Admin / Curador
  if (curr === 'v_rak' || curr === 'rodrigo' || curr === 'rodrigollanos') {
    return (
      creator === 'v_rak' || 
      creator === 'rodrigo' || 
      creator === 'rodrigollanos' || 
      creator === 'admin' || 
      creator === 'curador' || 
      creator === ''
    );
  }
  
  return false;
}

// Obtener playlists por creador
export async function getPlaylistsByCreator(username: string): Promise<Playlist[]> {
  const all = await getPlaylists();
  return all.filter(p => isUserCreator(p.creator_username, username));
}

// Obtener una playlist por slug
export async function getPlaylistBySlug(slug: string): Promise<Playlist | null> {
  const all = await getPlaylists();
  return all.find(p => p.slug === slug) || null;
}

// Guardar o actualizar playlist
export async function savePlaylist(playlist: Playlist): Promise<{ success: boolean; error?: string }> {
  if (supabase) {
    const { error: pError } = await supabase
      .from('playlists')
      .upsert({
        id: playlist.id,
        slug: playlist.slug,
        title: playlist.title,
        description: playlist.description,
        story: playlist.story,
        cover_url: playlist.cover_url,
        dominant_color: playlist.dominant_color,
        spotify_url: playlist.spotify_url,
        youtube_url: playlist.youtube_url,
        tags: playlist.tags,
        release_date: playlist.release_date,
        release_type: playlist.release_type,
        catalog_number: playlist.catalog_number,
        creator_username: playlist.creator_username,
        creator_name: playlist.creator_name,
        creator_avatar: playlist.creator_avatar,
        updated_at: new Date().toISOString()
      });

    if (pError) {
      return { success: false, error: pError.message };
    }

    if (playlist.tracks && playlist.tracks.length > 0) {
      await supabase.from('tracks').delete().eq('playlist_id', playlist.id);

      const tracksToInsert = playlist.tracks.map((t, index) => ({
        playlist_id: playlist.id,
        position: index + 1,
        title: t.title,
        artist: t.artist,
        duration_ms: t.duration_ms,
        notes: t.notes,
        spotify_track_id: t.spotify_track_id,
        youtube_video_id: t.youtube_video_id
      }));

      const { error: tError } = await supabase.from('tracks').insert(tracksToInsert);
      if (tError) {
        return { success: false, error: tError.message };
      }
    }

    return { success: true };
  }

  // Guardar en IndexedDB localmente sin límite de quota
  if (typeof window !== 'undefined') {
    const ok = await saveLocalPlaylist(playlist);
    return { success: ok };
  }

  return { success: true };
}

// Eliminar playlist
export async function deletePlaylist(id: string): Promise<{ success: boolean; error?: string }> {
  if (supabase) {
    const { error } = await supabase.from('playlists').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  if (typeof window !== 'undefined') {
    const ok = await deleteLocalPlaylist(id);
    return { success: ok };
  }

  return { success: true };
}

// Obtener perfil de usuario
export async function getUserProfile(username: string): Promise<UserProfile | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        email: data.email,
        bio: data.bio,
        avatarUrl: data.avatar_url,
        spotifyUrl: data.spotify_url,
        lastfmUrl: data.lastfm_url,
        joined_at: data.created_at,
      };
    }
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`canon_profile_${username.toLowerCase()}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    const currentSession = localStorage.getItem('canon_user_profile');
    if (currentSession) {
      try {
        const parsed = JSON.parse(currentSession);
        if (parsed.username.toLowerCase() === username.toLowerCase()) {
          return parsed;
        }
      } catch {}
    }
  }

  return {
    username: username,
    displayName: username,
    bio: 'Curador en Molva.',
  };
}
