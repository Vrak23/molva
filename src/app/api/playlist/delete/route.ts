import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://znbihwazambtwjwizmsn.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_C7JjbD4TMFzBGysYO835GQ_s1rRzvm-';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSupabase() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["']|["']$/g, '');
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/^["']|["']$/g, '');

  const url = (envUrl && envUrl.startsWith('https://')) ? envUrl : DEFAULT_SUPABASE_URL;
  const key = (envKey && (envKey.startsWith('sb_publishable_') || envKey.startsWith('eyJ')))
    ? envKey
    : DEFAULT_ANON_KEY;

  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = body?.id || req.nextUrl.searchParams.get('id');

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Identificador de playlist requerido para eliminar.' },
        { status: 400 }
      );
    }

    let supabase = getSupabase();

    let { error } = await supabase
      .from('spotitracker_curator')
      .delete()
      .eq('id', id.trim());

    if (error && (error.message.includes('Invalid API key') || error.code === 'PGRST301')) {
      console.warn('Clave de Supabase en Vercel inválida al eliminar, aplicando clave de respaldo garantizada.');
      supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_ANON_KEY);
      const retry = await supabase
        .from('spotitracker_curator')
        .delete()
        .eq('id', id.trim());
      error = retry.error;
    }

    if (error) {
      console.error('Error al eliminar fila en spotitracker_curator:', error);
      return NextResponse.json(
        { success: false, error: `Error de Supabase: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Playlist eliminada con éxito de Supabase y Tune Tracker.',
    });
  } catch (err: any) {
    console.error('Excepción en /api/playlist/delete:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error del servidor al eliminar.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
