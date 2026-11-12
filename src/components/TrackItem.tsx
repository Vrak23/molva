'use client';

import React, { useState } from 'react';
import { Track } from '@/types';
import { ChevronDown, ChevronUp, FileText, Play } from 'lucide-react';

interface TrackItemProps {
  track: Track;
  index: number;
}

export function TrackItem({ track, index }: TrackItemProps) {
  const [isOpen, setIsOpen] = useState(Boolean(track.notes));
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const hasNotes = Boolean(track.notes && track.notes.trim().length > 0);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-150 hover:bg-[#14141a] border border-transparent hover:border-white/[0.05]"
    >
      <div className="flex items-center justify-between gap-3 sm:gap-5">
        {/* Número de Pista / Play Icon y Datos de la Canción */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Swapper: número o ícono play en hover estilo Tidal */}
          <div className="w-6 text-right flex-shrink-0 flex items-center justify-end font-mono text-xs text-[#6e6e78]">
            {isHovered ? (
              <Play className="w-3.5 h-3.5 text-white fill-white transform translate-x-0.5" />
            ) : (
              <span className="tabular-nums">{String(index + 1).padStart(2, '0')}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
              {track.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#8c8c96] truncate mt-0.5">
              <span className="truncate hover:text-white transition-colors">{track.artist}</span>
              {track.album && (
                <>
                  <span className="text-[#454550] flex-shrink-0">•</span>
                  <span className="text-[#656570] truncate">{track.album}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Métricas: Streams de Tune Tracker, Duración y Botón de Notas */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Streams de Tune Tracker */}
          {track.plays !== undefined && track.plays > 0 && (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a0a0e] border border-white/[0.08] text-[10px] sm:text-[11px] font-mono text-zinc-300 group-hover:border-cyan-500/30 transition-colors"
              title={`${track.plays} reproducciones en Tune Tracker`}
            >
              <Play className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
              <span className="tabular-nums">{track.plays.toLocaleString('es-ES')} <span className="hidden xs:inline">streams</span></span>
            </div>
          )}

          {/* Duración */}
          {track.duration_ms && (
            <span className="font-mono text-xs text-[#70707a] tabular-nums hidden sm:inline">
              {formatDuration(track.duration_ms)}
            </span>
          )}

          {/* Botón Desplegable de Notas del Curador */}
          {hasNotes && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono uppercase px-2.5 py-1 rounded-md bg-[#181820] border border-white/[0.08] text-[#90909c] hover:text-white hover:border-white/20 transition-all"
              title="Leer nota de curaduría"
            >
              <FileText className="w-3 h-3 text-cyan-400" />
              <span className="hidden xs:inline">Nota</span>
              {isOpen ? (
                <ChevronUp className="w-3 h-3 ml-0.5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5 text-zinc-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bloque Desplegable de Notas del Curador con Acento Tidal */}
      {hasNotes && isOpen && (
        <div className="mt-3 ml-4 sm:ml-9 pl-4 border-l-2 border-cyan-400/80 bg-[#08080c] p-3 sm:p-3.5 rounded-r-xl border-y border-r border-white/[0.04]">
          <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-cyan-400 mb-1 flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
            <span>Memoria Curatorial:</span>
          </div>
          <p className="text-xs sm:text-sm text-[#d4d4dc] leading-relaxed font-sans italic">
            "{track.notes}"
          </p>
        </div>
      )}
    </div>
  );
}
