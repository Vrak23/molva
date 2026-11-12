import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znbihwazambtwjwizmsn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_C7JjbD4TMFzBGysYO835GQ_s1rRzvm-';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const playlist = await req.json();

    if (!playlist || !playlist.id) {
      return NextResponse.json(
        { success: false, error: 'Identificador de playlist no válido.' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Obtener la fila correspondiente en spotitracker_curator
    const { data: existingRow, error: fetchErr } = await supabase
      .from('spotitracker_curator')
      .select('*')
      .eq('id', playlist.id)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.warn('Advertencia al consultar fila existente en spotitracker_curator:', fetchErr);
    }

    const existingSettings = existingRow?.settings || {};

    // Mapear notas individuales de pistas
    const trackNotesMap: Record<string, string> = {};
    if (Array.isArray(playlist.tracks)) {
      playlist.tracks.forEach((t: any) => {
        if (t.id && t.notes) {
          trackNotesMap[t.id] = t.notes;
        }
      });
    }

    // Actualizar settings.molva preservando campos de Tune Tracker
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
        trackNotes: trackNotesMap,
        synced_at: new Date().toISOString()
      }
    };

    // Actualizar notas en las pistas seleccionadas de Tune Tracker
    let updatedTracks = existingRow?.selected_tracks || [];
    if (Array.isArray(updatedTracks) && updatedTracks.length > 0 && Array.isArray(playlist.tracks)) {
      updatedTracks = updatedTracks.map((rawT: any, idx: number) => {
        const editedT = playlist.tracks.find(
          (pt: any) => pt.title === (rawT.name || rawT.title) && pt.artist === rawT.artist
        ) || playlist.tracks[idx];
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
      console.error('Error actualizando spotitracker_curator en Supabase:', updError);
      return NextResponse.json(
        { success: false, error: `Error de Supabase: ${updError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Playlist sincronizada y guardada en Supabase con éxito.'
    });
  } catch (err: any) {
    console.error('Excepción en /api/playlist/save:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error del servidor al guardar.' },
      { status: 500 }
    );
  }
}
