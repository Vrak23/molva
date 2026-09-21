'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Playlist } from '@/types';
import { Disc, Calendar, User } from 'lucide-react';

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const trackCount = playlist.tracks?.length || 0;

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
      className="group relative flex flex-col bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-500 hover:-translate-y-1 ambient-card-glow"
    >
      {/* Resplandor ambiental de la portada */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-xl"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${playlist.dominant_color || '#333'} 0%, transparent 70%)`,
          opacity: isHovered ? 0.28 : 0,
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
            className="object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[15%] group-hover:grayscale-0"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-700">
            <Disc className="w-12 h-12" />
          </div>
        )}

        {/* Badge de Formato de Lanzamiento (LP / EP / Mixtape) */}
        <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded border border-white/15 text-[10px] font-mono uppercase tracking-widest text-zinc-200">
          {playlist.release_type || 'LP'}
        </div>

        {/* Badge de cantidad de pistas */}
        <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-[11px] font-mono text-zinc-300">
          {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
        </div>
      </Link>

      {/* Información del Lanzamiento */}
      <div className="p-5 flex-1 flex flex-col justify-between z-10">
        <div>
          {/* Creador / Curador */}
          <div className="flex items-center gap-2 mb-2">
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
        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[11px]">{releaseFormatted}</span>
          </div>

          {playlist.catalog_number ? (
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {playlist.catalog_number}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500">
              Lanzamiento
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
