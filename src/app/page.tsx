'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Playlist, UserProfile } from '@/types';
import { getPlaylists } from '@/lib/supabase';
import { PlaylistCard } from '@/components/PlaylistCard';
import { Search, Disc3, Plus, Layers, ArrowUpDown, Calendar } from 'lucide-react';

export default function HomePage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 'desc': más reciente primero

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPlaylists();
        setPlaylists(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtrado y Ordenamiento estricto por Fecha de Creación / Lanzamiento
  const processedPlaylists = useMemo(() => {
    let result = [...playlists];

    // 1. Filtrado por formato (LP, EP, Single, etc.)
    if (selectedFormat !== 'ALL') {
      result = result.filter(p => (p.release_type || 'LP') === selectedFormat);
    }

    // 2. Filtrado por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(playlist => {
        return (
          playlist.title.toLowerCase().includes(q) ||
          playlist.creator_username.toLowerCase().includes(q) ||
          (playlist.creator_name && playlist.creator_name.toLowerCase().includes(q)) ||
          (playlist.upcoming_album && playlist.upcoming_album.toLowerCase().includes(q)) ||
          (playlist.description && playlist.description.toLowerCase().includes(q)) ||
          (playlist.tracks && playlist.tracks.some(t => 
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q)
          ))
        );
      });
    }

    // 3. Ordenamiento por fecha de creación/lanzamiento
    result.sort((a, b) => {
      const dateA = new Date(a.release_date || a.created_at).getTime();
      const dateB = new Date(b.release_date || b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [playlists, selectedFormat, searchQuery, sortOrder]);

  return (
    <div className="space-y-10">
      {/* Portada / Hero de la Plataforma */}
      <section className="pt-2 pb-6 border-b border-zinc-800/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">
              <Disc3 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Biblioteca Abierta de Curaduría & Lanzamientos</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white font-sans">
              Explorar <span className="font-semibold text-zinc-100">Playlists & Álbumes</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-xl leading-relaxed">
              Descubre curadurías musicales concebidas como lanzamientos discográficos: con fecha de estreno, fichas técnicas y notas canción por canción publicadas por la comunidad.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lanzar Playlist</span>
            </Link>

            <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>{playlists.length} {playlists.length === 1 ? 'lanzamiento' : 'lanzamientos'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Búsqueda, Filtro de Formato y Selector de Orden */}
      {playlists.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por título, adelanto, curador (@usuario), artista..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#121215] border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors font-sans"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-xs font-mono text-zinc-300 transition-colors"
                title="Cambiar orden de fecha"
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Fecha: {sortOrder === 'desc' ? 'Más recientes' : 'Más antiguas'}</span>
                <ArrowUpDown className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          </div>

          {/* Filtros de Formato (Todos, LP, EP, Singles, etc.) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            {[
              { id: 'ALL', label: 'Todos los formatos' },
              { id: 'LP', label: 'Álbumes (LP)' },
              { id: 'EP', label: 'EPs' },
              { id: 'Single', label: 'Singles / Adelantos' },
              { id: 'Mixtape', label: 'Mixtapes' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={`px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="aspect-square bg-zinc-900/40 rounded-xl animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : processedPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                La biblioteca está vacía
              </h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                Inicia sesión o regístrate para publicar el primer lanzamiento con fecha y notas de curaduría.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publicar Primer Lanzamiento</span>
              </Link>
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
