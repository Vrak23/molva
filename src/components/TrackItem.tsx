'use client';

import React, { useState } from 'react';
import { Track } from '@/types';
import { ChevronDown, ChevronUp, FileText, Music } from 'lucide-react';

interface TrackItemProps {
  track: Track;
  index: number;
}

export function TrackItem({ track, index }: TrackItemProps) {
  const [isOpen, setIsOpen] = useState(Boolean(track.notes));

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const hasNotes = Boolean(track.notes && track.notes.trim().length > 0);

  return (
    <div className="group border-b border-[#27272a]/60 last:border-b-0 py-3.5 px-4 transition-colors hover:bg-zinc-900/30 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        {/* Número y Título */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span className="w-6 text-right font-mono text-xs text-zinc-500 flex-shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-white truncate group-hover:text-zinc-100">
              {track.title}
            </h4>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {track.artist}
            </p>
          </div>
        </div>

        {/* Duración y Botón de Notas */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {track.duration_ms && (
            <span className="font-mono text-xs text-zinc-500">
              {formatDuration(track.duration_ms)}
            </span>
          )}

          {hasNotes && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
              title="Ver notas de curaduría"
            >
              <FileText className="w-3 h-3 text-zinc-400" />
              <span>Nota</span>
              {isOpen ? (
                <ChevronUp className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bloque de Notas Personales */}
      {hasNotes && isOpen && (
        <div className="mt-3 ml-10 pl-4 border-l-2 border-zinc-700 bg-zinc-950/40 p-3 rounded-r-lg">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            <span>Memoria / Nota Curatorial:</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-sans italic">
            "{track.notes}"
          </p>
        </div>
      )}
    </div>
  );
}
