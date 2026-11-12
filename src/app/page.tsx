'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Playlist } from '@/types';
import { getPlaylists, savePlaylist } from '@/lib/supabase';
import { PlaylistCard } from '@/components/PlaylistCard';
import { Search, Settings, ArrowUpDown, Calendar, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await getPlaylists();
      setPlaylists(data);

      // Auto-sincronizar personalizaciones pendientes guardadas en este dispositivo hacia Supabase
      if (typeof window !== 'undefined' && data && data.length > 0) {
        try {
          const rawLocal = localStorage.getItem('molva_customizations_map');
          if (rawLocal) {
            const map = JSON.parse(rawLocal);
            const target = data[0];
            const localCustom = map[target.id] || map[target.title] || map['default'];

            const hasPendingData = localCustom && (
              (localCustom.cover_url && !target.cover_url) ||
              (localCustom.story && !target.story) ||
              (localCustom.description && localCustom.description !== target.description) ||
              (localCustom.trackNotes && Object.keys(localCustom.trackNotes).length > 0) ||
              !localCustom.synced_at
            );

            if (hasPendingData) {
              const toSync: Playlist = {
                ...target,
                ...localCustom,
                id: target.id
              };
              savePlaylist(toSync).then((res) => {
                if (res.success) {
                  getPlaylists().then(setPlaylists);
                }
              });
            }
          }
        } catch {}
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Filtrado y Ordenamiento
  const processedPlaylists = useMemo(() => {
    let result = [...playlists];

    // 1. Filtrado por formato
    if (selectedFormat !== 'ALL') {
      result = result.filter(p => (p.release_type || 'Semestral') === selectedFormat);
    }

    // 2. Filtrado por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(playlist => {
        return (
          playlist.title.toLowerCase().includes(q) ||
          playlist.creator_username.toLowerCase().includes(q) ||
          (playlist.period_str && playlist.period_str.toLowerCase().includes(q)) ||
          (playlist.cycle_year && playlist.cycle_year.toLowerCase().includes(q)) ||
          (playlist.description && playlist.description.toLowerCase().includes(q)) ||
          (playlist.tags && playlist.tags.some(t => t.toLowerCase().includes(q))) ||
          (playlist.tracks && playlist.tracks.some(t => 
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q) ||
            (t.album && t.album.toLowerCase().includes(q))
          ))
        );
      });
    }

    // 3. Ordenamiento por fecha de lanzamiento
    result.sort((a, b) => {
      const dateA = new Date(a.release_date || a.created_at).getTime();
      const dateB = new Date(b.release_date || b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [playlists, selectedFormat, searchQuery, sortOrder]);

  const totalTracks = useMemo(() => {
    return playlists.reduce((acc, p) => acc + (p.tracks?.length || 0), 0);
  }, [playlists]);

  const totalStreams = useMemo(() => {
    return playlists.reduce((acc, p) => acc + (p.tracks || []).reduce((tAcc, t) => tAcc + (t.plays || 0), 0), 0);
  }, [playlists]);

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Encabezado Editorial Limpio */}
      <section className="pt-2 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#8c8c96]">
            <span className="w-1.5 h-1.5 bg-cyan-400 rotate-45 shadow-[0_0_6px_rgba(0,240,255,0.7)]" />
            <span>Tune Tracker Collection</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
            Lanzamientos
          </h1>

          <p className="text-xs sm:text-sm text-[#8c8c96] font-sans">
            Archivo sonoro y curaduría discográfica personal.
          </p>
        </div>
      </section>

      {/* Barra de Búsqueda, Filtro de Formato y Selector de Orden */}
      {playlists.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            {/* Buscador */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e78]" />
              <input
                type="text"
                placeholder="Buscar por título, artista, canción, periodo o etiqueta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0e0e13] border border-white/[0.08] rounded-lg text-xs text-zinc-100 placeholder-[#6e6e78] focus:outline-none focus:border-white/30 transition-colors font-sans"
              />
            </div>

            {/* Orden por fecha */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#0e0e13] border border-white/[0.08] hover:border-white/20 text-xs font-mono text-[#8c8c96] hover:text-white transition-colors"
                title="Cambiar orden de fecha"
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Fecha: {sortOrder === 'desc' ? 'Más recientes' : 'Más antiguas'}</span>
                <ArrowUpDown className="w-3 h-3 text-[#6e6e78]" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Catálogo de Lanzamientos en Grid Responsive */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="aspect-square bg-[#0e0e13] rounded-xl animate-pulse border border-white/[0.06]" />
            ))}
          </div>
        ) : processedPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {processedPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/[0.08] rounded-2xl bg-[#0a0a0e] space-y-4">
            <div className="w-12 h-12 rounded-full border border-white/[0.12] flex items-center justify-center mx-auto text-zinc-500 bg-black">
              <span className="w-4 h-4 bg-white rotate-45 transform" />
            </div>
            <div>
              <h3 className="font-mono text-sm text-zinc-200 uppercase tracking-wider font-semibold">
                No hay playlists registradas en Tune Tracker
              </h3>
              <p className="mt-1 text-xs text-[#8c8c96] max-w-sm mx-auto font-sans">
                Guarda una selección desde el Curador de Playlists en Tune Tracker para verla reflejada aquí automáticamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-white/[0.08] rounded-2xl bg-[#0a0a0e]">
            <p className="font-mono text-xs text-[#8c8c96]">
              No se encontraron coincidencias para "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs font-mono text-cyan-400 underline hover:text-cyan-300"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
