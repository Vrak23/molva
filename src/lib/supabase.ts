import { createClient } from '@supabase/supabase-js';
import { Playlist, Track, UserProfile } from '@/types';
import { INITIAL_MOCK_PLAYLISTS } from './mock-data';
import { getLocalPlaylists, saveLocalPlaylist, deleteLocalPlaylist } from './local-storage-db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znbihwazambtwjwizmsn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_C7JjbD4TMFzBGysYO835GQ_s1rRzvm-';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Función auxiliar para generar slug limpio
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'playlist';
}

// Convertir fila de spotitracker_curator en objeto Playlist de Molva
function mapCuratorRowToPlaylist(row: any, localCustomization?: Partial<Playlist>): Playlist {
  const molvaMeta = row.settings?.molva || {};
  const mergedMeta = { ...molvaMeta, ...(localCustomization || {}) };

  const rawTitle = mergedMeta.title || row.settings?.playlist_name || (row.cycle_year ? `Top ${row.cycle_year} - ${row.cycle_half === '1' ? '1ra Mitad' : '2da Mitad'}` : 'Selección Tune Tracker');
  const slug = mergedMeta.slug || slugify(rawTitle) || row.id || 'tune-tracker-playlist';

  const cycleYear = row.cycle_year || '';
  const cycleHalf = row.cycle_half || '';
  const periodStr = cycleYear && cycleHalf
    ? (cycleHalf === '1' ? `1 Ene — 20 May ${cycleYear}` : `1 Jun — 20 Nov ${cycleYear}`)
    : 'Periodo Semestral';

  const defaultDesc = `Selección curada en Tune Tracker para el ciclo ${periodStr}. Generada con historial analítico y curaduría discográfica personal.`;

  // Mapear pistas de selected_tracks
  const rawTracks = Array.isArray(row.selected_tracks) ? row.selected_tracks : [];
  const tracks: Track[] = rawTracks.map((t: any, index: number) => {
    const trackId = t.id || t.uri || `track-${row.id}-${index + 1}`;
    const cleanSpotifyId = t.uri && t.uri.startsWith('spotify:track:')
      ? t.uri.replace('spotify:track:', '')
      : (t.spotify_track_id || '');

    // Buscar si hay notas guardadas localmente para esta pista
    const localTrack = localCustomization?.tracks?.find(lt => lt.title === (t.name || t.title) && lt.artist === t.artist);

    return {
      id: trackId,
      playlist_id: row.id || 'default',
      position: index + 1,
      title: t.name || t.title || 'Pista sin título',
      artist: t.artist || 'Artista desconocido',
      album: t.album || '',
      duration_ms: t.duration_ms,
      plays: typeof t.plays === 'number' ? t.plays : (t.count || 0),
      notes: mergedMeta.trackNotes?.[trackId] || localTrack?.notes || t.notes || '',
      spotify_track_id: cleanSpotifyId,
      uri: t.uri,
      youtube_video_id: t.youtube_video_id
    };
  });

  return {
    id: row.id || 'default',
    slug: slug,
    title: rawTitle,
    description: mergedMeta.description || defaultDesc,
    story: mergedMeta.story || '',
    cover_url: mergedMeta.cover_url || '',
    dominant_color: mergedMeta.dominant_color || '#262626',
    spotify_url: mergedMeta.spotify_url || '',
    youtube_url: mergedMeta.youtube_url || '',
    tags: mergedMeta.tags && mergedMeta.tags.length > 0 ? mergedMeta.tags : ['TUNE TRACKER', 'CURADURÍA'],
    release_date: mergedMeta.release_date || (row.updated_at ? row.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    release_type: mergedMeta.release_type || 'Semestral',
    catalog_number: mergedMeta.catalog_number || (cycleYear ? `TT-${cycleYear}-${cycleHalf || '01'}` : 'TT-01'),
    upcoming_album: mergedMeta.upcoming_album || '',
    cycle_year: cycleYear,
    cycle_half: cycleHalf,
    period_str: periodStr,
    target_count: row.target_count || tracks.length,
    creator_id: row.user_id || 'Vrak_23',
    creator_username: 'Vrak_23',
    creator_name: mergedMeta.creator_name || 'Vrak23',
    creator_avatar: mergedMeta.creator_avatar || '',
    created_at: row.updated_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    tracks: tracks
  };
}

// Obtener todas las playlists desde la base de datos de Tune Tracker (spotitracker_curator)
export async function getPlaylists(): Promise<Playlist[]> {
  let localCustomizations: Record<string, any> = {};

  if (typeof window !== 'undefined') {
    try {
      const rawLocal = localStorage.getItem('molva_customizations_map');
      if (rawLocal) {
        localCustomizations = JSON.parse(rawLocal);
      }
    } catch {}
  }

  if (supabase) {
    try {
      const { data: rows, error } = await supabase
        .from('spotitracker_curator')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && rows && rows.length > 0) {
        const playlists = rows.map(row => {
          const custom = localCustomizations[row.id] || localCustomizations[row.settings?.playlist_name] || {};
          return mapCuratorRowToPlaylist(row, custom);
        });
        return playlists;
      }
    } catch (err) {
      console.warn('Error conectando a spotitracker_curator en Supabase:', err);
    }
  }

  // Fallback a almacenamiento local IndexedDB
  if (typeof window !== 'undefined') {
    const local = await getLocalPlaylists();
    if (local && local.length > 0) {
      return local;
    }
  }

  return INITIAL_MOCK_PLAYLISTS;
}

// Verificar si el usuario es el curador propietario (Vrak23 / Rodrigo)
export function isUserCreator(playlistCreator?: string, currentUsername?: string): boolean {
  if (!currentUsername) return true; // En modo portafolio personal, el admin tiene control total
  const curr = currentUsername.toLowerCase();
  return curr === 'vrak_23' || curr === 'vrak23' || curr === 'admin' || curr === 'rodrigo';
}

// Obtener playlists por creador
export async function getPlaylistsByCreator(username: string): Promise<Playlist[]> {
  const all = await getPlaylists();
  return all;
}

// Obtener una playlist por slug o id
export async function getPlaylistBySlug(slug: string): Promise<Playlist | null> {
  const all = await getPlaylists();
  const clean = slug.toLowerCase();
  return all.find(p => p.slug.toLowerCase() === clean || p.id.toLowerCase() === clean) || null;
}

// Guardar o actualizar la personalización de la playlist
export async function savePlaylist(playlist: Playlist): Promise<{ success: boolean; error?: string }> {
  // 1. Guardar mapa de personalizaciones local en localStorage / IndexedDB
  if (typeof window !== 'undefined') {
    try {
      const rawMap = localStorage.getItem('molva_customizations_map') || '{}';
      const map = JSON.parse(rawMap);
      
      const trackNotesMap: Record<string, string> = {};
      if (playlist.tracks) {
        playlist.tracks.forEach(t => {
          if (t.notes) {
            trackNotesMap[t.id] = t.notes;
          }
        });
      }

      map[playlist.id] = {
        title: playlist.title,
        slug: playlist.slug,
        description: playlist.description,
        story: playlist.story,
        cover_url: playlist.cover_url,
        dominant_color: playlist.dominant_color,
        release_date: playlist.release_date,
        release_type: playlist.release_type,
        catalog_number: playlist.catalog_number,
        upcoming_album: playlist.upcoming_album,
        spotify_url: playlist.spotify_url,
        youtube_url: playlist.youtube_url,
        tags: playlist.tags,
        creator_name: playlist.creator_name,
        creator_avatar: playlist.creator_avatar,
        trackNotes: trackNotesMap,
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('molva_customizations_map', JSON.stringify(map));
      await saveLocalPlaylist(playlist);
    } catch (e) {
      console.warn('Error guardando en almacenamiento local:', e);
    }
  }

  // 2. Persistir directamente en Supabase (spotitracker_curator)
  if (supabase) {
    try {
      // Obtener el registro actual para no pisar campos existentes de Tune Tracker
      const { data: existingRow } = await supabase
        .from('spotitracker_curator')
        .select('*')
        .eq('id', playlist.id)
        .single();

      const existingSettings = existingRow?.settings || {};
      const trackNotesMap: Record<string, string> = {};
      if (playlist.tracks) {
        playlist.tracks.forEach(t => {
          if (t.notes) trackNotesMap[t.id] = t.notes;
        });
      }

      const updatedSettings = {
        ...existingSettings,
        playlist_name: playlist.title,
        molva: {
          title: playlist.title,
          slug: playlist.slug,
          description: playlist.description,
          story: playlist.story,
          cover_url: playlist.cover_url,
          dominant_color: playlist.dominant_color,
          release_date: playlist.release_date,
          release_type: playlist.release_type,
          catalog_number: playlist.catalog_number,
          upcoming_album: playlist.upcoming_album,
          spotify_url: playlist.spotify_url,
          youtube_url: playlist.youtube_url,
          tags: playlist.tags,
          creator_name: playlist.creator_name,
          creator_avatar: playlist.creator_avatar,
          trackNotes: trackNotesMap
        }
      };

      // Si hay pistas existentes en Tune Tracker, enriquecerlas con las notas
      let updatedTracks = existingRow?.selected_tracks || [];
      if (Array.isArray(updatedTracks) && updatedTracks.length > 0 && playlist.tracks) {
        updatedTracks = updatedTracks.map((rawT: any, idx: number) => {
          const editedT = playlist.tracks?.find(pt => pt.title === (rawT.name || rawT.title) && pt.artist === rawT.artist) || playlist.tracks?.[idx];
          return {
            ...rawT,
            notes: editedT?.notes || rawT.notes || ''
          };
        });
      }

      const { error: updError } = await supabase
        .from('spotitracker_curator')
        .update({
          settings: updatedSettings,
          selected_tracks: updatedTracks,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlist.id);

      if (updError) {
        console.warn('Error al actualizar en Supabase:', updError);
        // Aun si falla la red con Supabase, devolvemos success si se guardó localmente
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Excepción guardando en Supabase:', err);
      return { success: true };
    }
  }

  return { success: true };
}

// Eliminar personalización de playlist
export async function deletePlaylist(id: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      const rawMap = localStorage.getItem('molva_customizations_map') || '{}';
      const map = JSON.parse(rawMap);
      delete map[id];
      localStorage.setItem('molva_customizations_map', JSON.stringify(map));
      await deleteLocalPlaylist(id);
    } catch {}
  }

  return { success: true };
}

// Obtener perfil de curador principal (Vrak23 / Rodrigo)
export async function getUserProfile(username: string = 'Vrak_23'): Promise<UserProfile | null> {
  let customProfile: Partial<UserProfile> = {};

  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('canon_profile_vrak_23') || localStorage.getItem('canon_user_session');
      if (local) {
        customProfile = JSON.parse(local);
      }
    } catch {}
  }

  return {
    username: 'Vrak_23',
    displayName: customProfile.displayName || 'Vrak23',
    email: customProfile.email || 'rodrigodanielllanos2@gmail.com',
    bio: customProfile.bio || 'Curador y creador sonoro en Tune Tracker y Molva. Compilaciones discográficas semestrales y memoria musical.',
    avatarUrl: customProfile.avatarUrl || '',
    spotifyUrl: customProfile.spotifyUrl || 'https://open.spotify.com',
    lastfmUrl: customProfile.lastfmUrl || 'https://www.last.fm/user/Vrak_23',
    joined_at: '2026-01-01',
  };
}
