'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface PlayerEmbedProps {
  spotifyUrl?: string;
  youtubeUrl?: string;
}

export function PlayerEmbed({ spotifyUrl, youtubeUrl }: PlayerEmbedProps) {
  const [activeTab, setActiveTab] = useState<'spotify' | 'youtube'>(
    spotifyUrl ? 'spotify' : youtubeUrl ? 'youtube' : 'spotify'
  );

  // Extraer ID de Spotify
  const getSpotifyEmbedUrl = (url: string) => {
    try {
      const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        return `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator&theme=0`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Extraer ID de YouTube Playlist
  const getYoutubeEmbedUrl = (url: string) => {
    try {
      const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://www.youtube-nocookie.com/embed/videoseries?list=${match[1]}`;
      }
      // Si es un video individual
      const vMatch = url.match(/(?:youtu\.be\/|watch\?v=)([a-zA-Z0-9_-]+)/);
      if (vMatch && vMatch[1]) {
        return `https://www.youtube-nocookie.com/embed/${vMatch[1]}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const hasSpotify = Boolean(spotifyUrl);
  const hasYoutube = Boolean(youtubeUrl);

  if (!hasSpotify && !hasYoutube) {
    return null;
  }

  return (
    <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden">
      {/* Selector de plataforma */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a] bg-zinc-950/60">
        <div className="flex items-center gap-2">
          {hasSpotify && (
            <button
              onClick={() => setActiveTab('spotify')}
              className={`px-3 py-1 text-xs font-mono uppercase tracking-wider rounded transition-all ${
                activeTab === 'spotify'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800'
              }`}
            >
              Spotify Player
            </button>
          )}

          {hasYoutube && (
            <button
              onClick={() => setActiveTab('youtube')}
              className={`px-3 py-1 text-xs font-mono uppercase tracking-wider rounded transition-all ${
                activeTab === 'youtube'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800'
              }`}
            >
              YouTube Player
            </button>
          )}
        </div>

        <div>
          {activeTab === 'spotify' && spotifyUrl && (
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Abrir App</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {activeTab === 'youtube' && youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Abrir App</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Frame del Reproductor */}
      <div className="w-full bg-black/60">
        {activeTab === 'spotify' && spotifyUrl && (
          <iframe
            src={getSpotifyEmbedUrl(spotifyUrl)}
            width="100%"
            height="380"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full rounded-b-xl"
          />
        )}

        {activeTab === 'youtube' && youtubeUrl && (
          <div className="aspect-video w-full">
            <iframe
              src={getYoutubeEmbedUrl(youtubeUrl)}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="w-full h-full rounded-b-xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}
