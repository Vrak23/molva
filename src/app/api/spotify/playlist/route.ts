import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function extractSpotifyPlaylistId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // spotify:playlist:xxxx
  const uriMatch = trimmed.match(/^spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  // https://open.spotify.com/.../playlist/xxxx
  const urlMatch = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Identificador directo de 22 caracteres alfanuméricos
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function cleanDescription(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .trim();
}

async function getSpotifyApiToken(clientId: string, clientSecret: string): Promise<string | null> {
  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${creds}`,
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('Fallo al obtener token de Spotify:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('Error solicitando token de Spotify:', err);
    return null;
  }
}

async function fetchFromOfficialSpotifyApi(playlistId: string, clientId: string, clientSecret: string) {
  const token = await getSpotifyApiToken(clientId, clientSecret);
  if (!token) return null;

  const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.warn(`Error al consultar playlist ${playlistId} en Spotify API:`, res.status);
    return null;
  }

  const data = await res.json();
  const allItems: any[] = [...(data.tracks?.items || [])];

  // Paginación si hay más de 100 canciones (hasta un límite seguro de 500)
  let nextUrl = data.tracks?.next;
  let pageCount = 0;
  while (nextUrl && pageCount < 4) {
    pageCount++;
    try {
      const pageRes = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!pageRes.ok) break;
      const pageData = await pageRes.json();
      if (Array.isArray(pageData.items)) {
        allItems.push(...pageData.items);
      }
      nextUrl = pageData.next;
    } catch {
      break;
    }
  }

  const validTracks = allItems
    .filter(item => item && item.track)
    .map((item, idx) => {
      const t = item.track;
      const artist = Array.isArray(t.artists)
        ? t.artists.map((a: any) => a.name).filter(Boolean).join(', ')
        : 'Artista desconocido';
      const cleanSpotifyId = t.id || '';
      return {
        id: cleanSpotifyId || `track-${playlistId}-${idx + 1}`,
        playlist_id: '',
        position: idx + 1,
        title: t.name || 'Pista sin título',
        artist,
        album: t.album?.name || '',
        duration_ms: typeof t.duration_ms === 'number' ? t.duration_ms : 0,
        plays: 0,
        notes: '',
        uri: t.uri || (cleanSpotifyId ? `spotify:track:${cleanSpotifyId}` : ''),
        spotify_track_id: cleanSpotifyId,
      };
    });

  const coverUrl = data.images && data.images.length > 0 ? data.images[0].url : '';

  return {
    source: 'spotify_api',
    playlist: {
      id: playlistId,
      title: data.name || 'Playlist de Spotify',
      description: cleanDescription(data.description || ''),
      cover_url: coverUrl,
      spotify_url: data.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistId}`,
      tracks: validTracks,
      total_tracks: validTracks.length,
    },
  };
}

async function fetchFromSpotifyPublicEmbed(playlistId: string) {
  try {
    const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const html = await res.text();

    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match || !match[1]) return null;

    const parsed = JSON.parse(match[1]);
    const entity = parsed?.props?.pageProps?.state?.data?.entity;
    if (!entity) return null;

    const title = entity.title || entity.name || 'Playlist de Spotify';
    let coverUrl = '';
    if (entity.coverArt?.sources && entity.coverArt.sources.length > 0) {
      coverUrl = entity.coverArt.sources[0].url || '';
    }

    // Intentar obtener descripción de meta tag si está disponible
    let description = '';
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) ||
                      html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    if (descMatch && descMatch[1]) {
      description = cleanDescription(descMatch[1]);
    }

    const rawTracks = Array.isArray(entity.trackList) ? entity.trackList : [];
    const validTracks = rawTracks.map((t: any, idx: number) => {
      const cleanSpotifyId = t.uri ? t.uri.replace('spotify:track:', '') : (t.id || '');
      return {
        id: cleanSpotifyId || `track-${playlistId}-${idx + 1}`,
        playlist_id: '',
        position: idx + 1,
        title: t.title || t.name || 'Pista sin título',
        artist: t.subtitle || t.artist || 'Artista desconocido',
        album: '',
        duration_ms: typeof t.duration === 'number' ? t.duration : 0,
        plays: 0,
        notes: '',
        uri: t.uri || (cleanSpotifyId ? `spotify:track:${cleanSpotifyId}` : ''),
        spotify_track_id: cleanSpotifyId,
      };
    });

    return {
      source: 'spotify_embed',
      playlist: {
        id: playlistId,
        title,
        description,
        cover_url: coverUrl,
        spotify_url: `https://open.spotify.com/playlist/${playlistId}`,
        tracks: validTracks,
        total_tracks: validTracks.length,
      },
    };
  } catch (err) {
    console.warn('Error en fallback de Spotify embed:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawUrl = body?.url || body?.spotify_url || '';

    const playlistId = extractSpotifyPlaylistId(rawUrl);
    if (!playlistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Enlace de Spotify no válido. Asegúrate de ingresar una URL de playlist como https://open.spotify.com/playlist/...',
        },
        { status: 400 }
      );
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

    // 1. Intentar con API Oficial si existen credenciales
    if (clientId && clientSecret) {
      const apiResult = await fetchFromOfficialSpotifyApi(playlistId, clientId, clientSecret);
      if (apiResult) {
        return NextResponse.json({
          success: true,
          ...apiResult,
        });
      }
    }

    // 2. Fallback con extractor público de Spotify Embed (sin necesidad obligatoria de credenciales)
    const embedResult = await fetchFromSpotifyPublicEmbed(playlistId);
    if (embedResult) {
      return NextResponse.json({
        success: true,
        ...embedResult,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: clientId && clientSecret
          ? 'No se pudo cargar la playlist desde Spotify. Verifica que el enlace sea público.'
          : 'No se pudo cargar la playlist automáticamente. Puedes configurar SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en .env.local para acceso directo oficial.',
      },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('Error interno en /api/spotify/playlist:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error interno al procesar la playlist de Spotify.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url') || req.nextUrl.searchParams.get('id') || '';
  const dummyReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ url: urlParam }),
  });
  return POST(dummyReq);
}
