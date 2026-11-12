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

export async function GET(req: NextRequest) {
  try {
    let supabase = getSupabase();

    let { data: rows, error } = await supabase
      .from('spotitracker_curator')
      .select('*')
      .order('updated_at', { ascending: false });

    // Si la clave del entorno de Vercel falló por "Invalid API key", reintentar con la clave pública verificada
    if (error && (error.message.includes('Invalid API key') || error.code === 'PGRST301')) {
      console.warn('Clave de Supabase en Vercel inválida, aplicando clave de respaldo garantizada.');
      supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_ANON_KEY);
      const retry = await supabase
        .from('spotitracker_curator')
        .select('*')
        .order('updated_at', { ascending: false });
      rows = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Error obteniendo spotitracker_curator en /api/playlists:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      rows: rows || [],
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (err: any) {
    console.error('Excepción en /api/playlists:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error del servidor al obtener playlists.' },
      { status: 500 }
    );
  }
}
