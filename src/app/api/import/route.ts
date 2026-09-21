import { NextRequest, NextResponse } from 'next/server';
import { parsePlaylistUrl } from '@/lib/importers';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'La URL es requerida.' }, { status: 400 });
    }

    const data = await parsePlaylistUrl(url);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar el enlace de la playlist.' },
      { status: 500 }
    );
  }
}
