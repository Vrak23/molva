'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Playlist } from '@/types';
import { Disc, Calendar, User, Play, Music2 } from 'lucide-react';

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
      className="group relative flex flex-col bg-[#0d0d12] border border-white/[0.08] rounded-xl overflow-hidden transition-all duration-300 hover:border-white/[0.25] hover:-translate-y-1.5 shadow-xl hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.9)]"
    >
      {/* Resplandor ambiental adaptativo estilo Tidal */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-xl"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${playlist.dominant_color || '#333'} 0%, transparent 72%)`,
          opacity: isHovered ? 0.32 : 0,
        }}
      />

      {/* Portada / Artwork con Play Overlay de Tidal */}
      <Link href={`/playlist/${playlist.slug}`} className="relative aspect-square w-full bg-[#14141a] overflow-hidden border-b border-white/[0.06] block">
        {playlist.cover_url ? (
          <Image
            src={playlist.cover_url}
            alt={playlist.title}
            fill
            unoptimized={playlist.cover_url.startsWith('data:')}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#101015] text-[#555560] space-y-2">
            <Disc className="w-14 h-14 text-[#3a3a44]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#707080]">Tune Tracker</span>
          </div>
        )}

        {/* Gradiente oscuro inferior para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Botón Flotante Play Estilo Tidal (Aparece en Hover) */}
        <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.6)] transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          <Play className="w-4 h-4 fill-black text-black ml-0.5" />
        </div>
      </Link>

      {/* Información del Lanzamiento */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between z-10 space-y-3">
        <div>
          {/* Fila Superior: Curador y Periodo */}
          <div className="flex min-w-0 items-center justify-between text-xs mb-1.5 gap-2">
            <Link
              href={`/u/${playlist.creator_username}`}
              className="flex min-w-0 items-center gap-1.5 text-[#8c8c96] hover:text-white transition-colors group/user"
            >
              {playlist.creator_avatar ? (
                <div className="relative w-4 h-4 rounded-full overflow-hidden border border-zinc-700">
                  <Image src={playlist.creator_avatar} alt={playlist.creator_username} fill className="object-cover" />
                </div>
              ) : (
                <User className="w-3.5 h-3.5 text-[#6c6c76]" />
              )}
              <span className="truncate font-mono text-[11px] text-[#b0b0ba] group-hover/user:text-white">
                @{playlist.creator_username}
              </span>
            </Link>

            {playlist.period_str && (
              <span className="text-[10px] font-mono text-[#767682] truncate max-w-[150px]">
                {playlist.period_str}
              </span>
            )}
          </div>

          {/* Título de la Playlist */}
          <Link href={`/playlist/${playlist.slug}`} className="block">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white line-clamp-1 group-hover:text-cyan-300 transition-colors font-sans">
              {playlist.title}
            </h2>
          </Link>

          {/* Descripción */}
          {playlist.description && (
            <p className="mt-1.5 text-xs text-[#8c8c96] line-clamp-2 leading-relaxed font-sans">
              {playlist.description}
            </p>
          )}
        </div>

        {/* Pie de Tarjeta: Fecha de Lanzamiento y Catálogo */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#70707a] font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#50505a]" />
            <span className="text-[11px]">{releaseFormatted}</span>
          </div>

          <span className="text-[10px] text-[#8a8a96] uppercase tracking-widest font-mono">
            {playlist.catalog_number || 'TT-01'}
          </span>
        </div>
      </div>
    </div>
  );
}
