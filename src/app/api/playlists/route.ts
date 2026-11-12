import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znbihwazambtwjwizmsn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_C7JjbD4TMFzBGysYO835GQ_s1rRzvm-';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: rows, error } = await supabase
      .from('spotitracker_curator')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo spotitracker_curator en /api/playlists:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      rows: rows || []
    });

    // Encabezados estrictos para evitar almacenamiento en caché intermedia
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
