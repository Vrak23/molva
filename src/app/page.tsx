'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Playlist } from '@/types';
import { getPlaylists } from '@/lib/supabase';
import { PlaylistCard } from '@/components/PlaylistCard';
import { Search, Disc3, Settings, Layers, ArrowUpDown, Calendar, RefreshCw } from 'lucide-react';

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

  return (
    <div className="space-y-10">
      {/* Portada / Hero del Visualizador */}
      <section className="pt-2 pb-6 border-b border-zinc-800/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">
              <Disc3 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Archivo & Visualizador de Curadurías • Tune Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-white font-sans">
              Colección de <span className="font-semibold text-zinc-100">Playlists & Lanzamientos</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed font-sans">
              Visualización discográfica de las playlists semestrales creadas en Tune Tracker. Cada entrega cuenta con ficha técnica, memoria conceptual y conteo de streams por canción.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
              title="Recargar playlists desde la base de datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>

            <Link
              href="/admin"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Estudio de Curaduría</span>
            </Link>

            <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>{playlists.length} {playlists.length === 1 ? 'lanzamiento' : 'lanzamientos'} ({totalTracks} temas)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Búsqueda, Filtro de Formato y Selector de Orden */}
      {playlists.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por título, artista, canción, periodo o etiqueta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#121215] border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors font-sans"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-xs font-mono text-zinc-300 transition-colors"
                title="Cambiar orden de fecha"
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Fecha: {sortOrder === 'desc' ? 'Más recientes' : 'Más antiguas'}</span>
                <ArrowUpDown className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          </div>

          {/* Filtros de Formato */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs font-mono">
            {[
              { id: 'ALL', label: 'Todos los lanzamientos' },
              { id: 'Semestral', label: 'Semestrales Tune Tracker' },
              { id: 'LP', label: 'Álbumes (LP)' },
              { id: 'EP', label: 'EPs' },
              { id: 'Compilación', label: 'Compilaciones' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={`px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap flex-shrink-0 ${
                  selectedFormat === fmt.id
                    ? 'bg-white text-black font-semibold border-white'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Catálogo de Lanzamientos */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="aspect-square bg-zinc-900/40 rounded-xl animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : processedPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {processedPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 space-y-4">
            <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600 bg-black">
              <Disc3 className="w-6 h-6 text-zinc-500" />
            </div>
            <div>
              <h3 className="font-mono text-sm text-zinc-300 uppercase tracking-wider">
                No hay playlists registradas en Tune Tracker
              </h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                Guarda una selección desde el Curador de Playlists en Tune Tracker para verla reflejada aquí automáticamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
            <p className="font-mono text-xs text-zinc-400">
              No se encontraron coincidencias para "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs font-mono text-white underline hover:text-zinc-300"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
