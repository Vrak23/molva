'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Playlist } from '@/types';
import { Disc, Calendar, User, Play } from 'lucide-react';

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const trackCount = playlist.tracks?.length || 0;
  const totalStreams = (playlist.tracks || []).reduce((acc, t) => acc + (t.plays || 0), 0);

  // Formato de fecha de lanzamiento
  const releaseFormatted = playlist.release_date
    ? new Date(playlist.release_date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date(playlist.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
      });

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-500 hover:-translate-y-1 ambient-card-glow shadow-xl"
    >
      {/* Resplandor ambiental de la portada */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-xl"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${playlist.dominant_color || '#333'} 0%, transparent 70%)`,
          opacity: isHovered ? 0.30 : 0,
        }}
      />

      {/* Portada / Artwork */}
      <Link href={`/playlist/${playlist.slug}`} className="relative aspect-square w-full bg-zinc-900 overflow-hidden border-b border-[#27272a] block">
        {playlist.cover_url ? (
          <Image
            src={playlist.cover_url}
            alt={playlist.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[10%] group-hover:grayscale-0"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-700 space-y-2">
            <Disc className="w-12 h-12 text-zinc-600" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Tune Tracker</span>
          </div>
        )}

        {/* Badge de Formato de Lanzamiento (Semestral / LP / EP) */}
        <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md px-2.5 py-0.5 rounded border border-white/15 text-[10px] font-mono uppercase tracking-widest text-zinc-200">
          {playlist.release_type || 'Semestral'}
        </div>

        {/* Badges Inferiores: Pistas y Streams */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {totalStreams > 0 && (
            <div className="bg-black/85 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-[10px] font-mono text-zinc-300 flex items-center gap-1">
              <Play className="w-2.5 h-2.5 text-zinc-400 fill-zinc-400" />
              <span>{totalStreams}</span>
            </div>
          )}
          <div className="bg-black/85 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-[10px] font-mono text-zinc-300">
            {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
          </div>
        </div>
      </Link>

      {/* Información del Lanzamiento */}
      <div className="p-5 flex-1 flex flex-col justify-between z-10 space-y-4">
        <div>
          {/* Curador */}
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/u/${playlist.creator_username}`}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors group/user"
            >
              {playlist.creator_avatar ? (
                <div className="relative w-4 h-4 rounded-full overflow-hidden border border-zinc-700">
                  <Image src={playlist.creator_avatar} alt={playlist.creator_username} fill className="object-cover" />
                </div>
              ) : (
                <User className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span className="font-mono text-[11px] font-medium text-zinc-300 group-hover/user:underline">
                @{playlist.creator_username}
              </span>
            </Link>

            {playlist.period_str && (
              <span className="text-[10px] font-mono text-zinc-500">
                {playlist.period_str}
              </span>
            )}
          </div>

          <Link href={`/playlist/${playlist.slug}`} className="block group-hover:text-zinc-100">
            <h2 className="text-base font-semibold tracking-tight text-white line-clamp-1">
              {playlist.title}
            </h2>
          </Link>

          {playlist.description && (
            <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {playlist.description}
            </p>
          )}
        </div>

        {/* Pie de Tarjeta: Fecha de Lanzamiento y Catálogo */}
        <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[11px]">{releaseFormatted}</span>
          </div>

          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
            {playlist.catalog_number || 'TT-CURADOR'}
          </span>
        </div>
      </div>
    </div>
  );
}
