import { ImportPreviewResult, ImportPreviewTrack } from '@/types';

/**
 * Parsea e importa metadatos completos y el tracklist (canciones)
 * de playlists públicas de Spotify y YouTube directamente desde el servidor.
 */
export async function parsePlaylistUrl(url: string): Promise<ImportPreviewResult> {
  const cleanUrl = url.trim();

  // 1. Spotify Playlist
  if (cleanUrl.includes('spotify.com/playlist/') || cleanUrl.includes('spotify:playlist:')) {
    return importSpotifyPlaylist(cleanUrl);
  }

  // 2. YouTube Playlist
  if (cleanUrl.includes('youtube.com/playlist') || cleanUrl.includes('list=')) {
    return importYouTubePlaylist(cleanUrl);
  }

  throw new Error('URL no reconocida. Ingresa un enlace válido de playlist de Spotify o YouTube.');
}

/**
 * Extrae todas las canciones de una playlist pública de Spotify
 * parseando la página de embed oficial de Spotify.
 */
async function importSpotifyPlaylist(url: string): Promise<ImportPreviewResult> {
  const match = url.match(/playlist[\/:]([a-zA-Z0-9]+)/);
  if (!match || !match[1]) {
    throw new Error('No se pudo identificar el ID de la playlist de Spotify.');
  }

  const playlistId = match[1];
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;

  try {
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Respuesta HTTP ${res.status} desde Spotify.`);
    }

    const html = await res.text();

    let title = 'Playlist de Spotify';
    let description = '';
    let coverUrl = '';
    const tracks: ImportPreviewTrack[] = [];

    // 1. Intentar extraer __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataMatch && nextDataMatch[1]) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const entity = nextData?.props?.pageProps?.state?.data?.entity;

        if (entity) {
          title = entity.name || entity.title || title;
          description = entity.description || '';
          if (entity.coverArt?.sources?.length > 0) {
            coverUrl = entity.coverArt.sources[0].url;
          }

          const rawTracks = entity.trackList || entity.tracks || [];
          rawTracks.forEach((item: any, idx: number) => {
            const trackName = item.title || item.name || `Pista ${idx + 1}`;
            const artistName = item.subtitle || (item.artists ? item.artists.map((a: any) => a.name).join(', ') : 'Varios Artistas');
            const durationMs = item.duration || (item.duration_ms ? item.duration_ms : undefined);
            const trackId = item.id || (item.uri ? item.uri.split(':').pop() : undefined);

            tracks.push({
              position: idx + 1,
              title: trackName,
              artist: artistName,
              duration_ms: durationMs,
              spotify_track_id: trackId,
              notes: '',
            });
          });
        }
      } catch (e) {
        console.error('Error parseando __NEXT_DATA__ de Spotify:', e);
      }
    }

    // 2. Si no se obtuvieron tracks de __NEXT_DATA__, buscar mediante regex en el HTML del embed
    if (tracks.length === 0) {
      // Buscar bloques de items de canciones
      const trackRegex = /"title":"([^"]+)","subtitle":"([^"]+)"/g;
      let m;
      let pos = 1;
      while ((m = trackRegex.exec(html)) !== null) {
        tracks.push({
          position: pos++,
          title: decodeHtmlEntities(m[1]),
          artist: decodeHtmlEntities(m[2]),
          notes: '',
        });
      }
    }

    // 3. Fallback de imagen / título por oEmbed si aún están vacíos
    if (!title || title === 'Playlist de Spotify' || !coverUrl) {
      try {
        const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
        if (oembedRes.ok) {
          const odata = await oembedRes.json();
          if (odata.title) title = odata.title;
          if (odata.thumbnail_url) coverUrl = odata.thumbnail_url;
        }
      } catch {}
    }

    return {
      platform: 'spotify',
      title: title || 'Playlist de Spotify',
      description: description || '',
      cover_url: coverUrl || '',
      tracks: tracks,
    };
  } catch (error: any) {
    throw new Error(`Error al autorellenar desde Spotify: ${error.message}`);
  }
}

/**
 * Extrae todas las canciones/videos de una playlist pública de YouTube
 * parseando ytInitialData.
 */
async function importYouTubePlaylist(url: string): Promise<ImportPreviewResult> {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (!match || !match[1]) {
    throw new Error('No se pudo identificar el ID de la lista de reproducción de YouTube.');
  }

  const playlistId = match[1];
  const ytUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

  try {
    const res = await fetch(ytUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Respuesta HTTP ${res.status} desde YouTube.`);
    }

    const html = await res.text();

    let title = 'Playlist de YouTube';
    let description = '';
    let coverUrl = '';
    const tracks: ImportPreviewTrack[] = [];

    // Extraer ytInitialData
    const dataMatch = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/s) ||
                      html.match(/window\["ytInitialData"\]\s*=\s*({.+?});<\/script>/s);

    if (dataMatch && dataMatch[1]) {
      try {
        const ytData = JSON.parse(dataMatch[1]);
        
        // Metadata general
        const header = ytData?.header?.playlistHeaderRenderer || ytData?.metadata?.playlistMetadataRenderer;
        if (header) {
          title = header.title?.simpleText || header.title?.runs?.[0]?.text || title;
          description = header.descriptionText?.simpleText || header.descriptionText?.runs?.[0]?.text || '';
          const thumbs = header.playlistHeaderBanner?.thumbnails || header.thumbnail?.thumbnails || [];
          if (thumbs.length > 0) {
            coverUrl = thumbs[thumbs.length - 1].url;
          }
        }

        // Extraer lista de videos/tracks
        const contents = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents || [];

        let pos = 1;
        for (const item of contents) {
          const video = item.playlistVideoRenderer;
          if (video && video.title) {
            const rawTitle = video.title.simpleText || video.title.runs?.[0]?.text || '';
            const channelName = video.shortBylineText?.runs?.[0]?.text || 'YouTube';
            const videoId = video.videoId;
            const lengthSeconds = video.lengthSeconds ? parseInt(video.lengthSeconds, 10) : undefined;

            // Limpieza de título: Si tiene formato "Artista - Canción", separar
            let parsedTitle = rawTitle;
            let parsedArtist = channelName;

            if (rawTitle.includes(' - ')) {
              const parts = rawTitle.split(' - ');
              parsedArtist = parts[0].trim();
              parsedTitle = parts.slice(1).join(' - ').trim();
              // Quitar coletillas comunes como (Official Music Video), [Audio Oficial], etc.
              parsedTitle = parsedTitle.replace(/\s*(\(|\[)(Official.*|Video.*|Audio.*|Letra.*|Lyric.*)(\)|\])/gi, '').trim();
            }

            tracks.push({
              position: pos++,
              title: parsedTitle || rawTitle,
              artist: parsedArtist || channelName,
              duration_ms: lengthSeconds ? lengthSeconds * 1000 : undefined,
              youtube_video_id: videoId,
              notes: '',
            });
          }
        }
      } catch (e) {
        console.error('Error parseando ytInitialData de YouTube:', e);
      }
    }

    // Fallback de oEmbed si no se obtuvo thumbnail o título
    if ((!coverUrl || !title || title === 'Playlist de YouTube') && playlistId) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (oembedRes.ok) {
          const odata = await oembedRes.json();
          if (odata.title) title = odata.title;
          if (odata.thumbnail_url) coverUrl = odata.thumbnail_url;
        }
      } catch {}
    }

    return {
      platform: 'youtube',
      title,
      description,
      cover_url: coverUrl,
      tracks,
    };
  } catch (error: any) {
    throw new Error(`Error al autorellenar desde YouTube: ${error.message}`);
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\\u0026/g, '&');
}
