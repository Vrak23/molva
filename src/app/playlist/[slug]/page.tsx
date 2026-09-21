'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Playlist } from '@/types';
import { getPlaylistBySlug } from '@/lib/supabase';
import { AmbientGlow } from '@/components/AmbientGlow';
import { TrackItem } from '@/components/TrackItem';
import { ArtworkModal } from '@/components/ArtworkModal';
import { 
  ArrowLeft, 
  Calendar, 
  Disc, 
  Maximize2, 
  ListMusic, 
  BookOpen, 
  Share2, 
  Check, 
  User, 
  Clock, 
  ExternalLink,
  ChevronUp
} from 'lucide-react';

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [artworkOpen, setArtworkOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPlaylistBySlug(resolvedParams.slug);
        setPlaylist(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Cargando lanzamiento...</p>
      </div>
    );
  }

  if (!playlist) {
    return notFound();
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const trackCount = playlist.tracks?.length || 0;

  // Duración total acumulada
  const totalDurationMs = (playlist.tracks || []).reduce((acc, t) => acc + (t.duration_ms || 0), 0);
  const totalMinutes = Math.floor(totalDurationMs / 60000);
  const totalSeconds = Math.floor((totalDurationMs % 60000) / 1000);
  const durationFormatted = totalMinutes > 0 ? `${totalMinutes} min ${totalSeconds > 0 ? `${totalSeconds} s` : ''}` : null;

  // Fecha de lanzamiento
  const releaseDateFormatted = playlist.release_date
    ? new Date(playlist.release_date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : new Date(playlist.created_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

  return (
    <div className="relative space-y-12">
      {/* Halo de fondo ambiental difuminado adaptado a la portada */}
      <AmbientGlow 
        color={playlist.dominant_color} 
        imageUrl={playlist.cover_url} 
        opacity={0.34} 
      />

      {/* Modal de Artwork */}
      {playlist.cover_url && (
        <ArtworkModal
          isOpen={artworkOpen}
          onClose={() => setArtworkOpen(false)}
          imageUrl={playlist.cover_url}
          title={playlist.title}
        />
      )}

      {/* Barra de Navegación Superior: Botón Volver y Compartir */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white transition-colors bg-zinc-900/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-zinc-800 hover:border-zinc-600 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors bg-zinc-950/80 backdrop-blur-md px-3.5 py-2 rounded-lg border border-zinc-800"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Enlace Copiado</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </>
          )}
        </button>
      </div>

      {/* Estructura Principal */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Columna Izquierda: Artwork & Ficha Discográfica */}
        <div className="lg:col-span-4 space-y-6 max-w-md mx-auto lg:max-w-none w-full">
          {/* Portada Principal */}
          <div className="group relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
            {playlist.cover_url ? (
              <>
                <Image
                  src={playlist.cover_url}
                  alt={playlist.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <button
                  onClick={() => setArtworkOpen(true)}
                  className="absolute bottom-3 right-3 p-2 rounded bg-black/80 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Expandir artwork"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700">
                <Disc className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Ficha Discográfica del Lanzamiento */}
          <div className="bg-[#121215]/80 backdrop-blur-md border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 pb-2 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                <span>Ficha Técnica</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300">
                {playlist.release_type || 'LP'}
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              {/* Curador */}
              <div className="flex items-center justify-between text-zinc-400">
                <span>Curaduría</span>
                <Link
                  href={`/u/${playlist.creator_username}`}
                  className="text-white hover:underline flex items-center gap-1.5 font-sans"
                >
                  {playlist.creator_avatar ? (
                    <div className="relative w-4 h-4 rounded-full overflow-hidden border border-zinc-700">
                      <Image src={playlist.creator_avatar} alt="Avatar" fill className="object-cover" />
                    </div>
                  ) : (
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                  <span>@{playlist.creator_username}</span>
                </Link>
              </div>

              {/* Fecha de Lanzamiento */}
              <div className="flex items-center justify-between text-zinc-400">
                <span>Fecha de Lanzamiento</span>
                <span className="text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  {releaseDateFormatted}
                </span>
              </div>

              {/* Pistas */}
              <div className="flex items-center justify-between text-zinc-400">
                <span>Pistas</span>
                <span className="text-white">{trackCount} canciones</span>
              </div>

              {/* Duración */}
              {durationFormatted && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Duración Total</span>
                  <span className="text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {durationFormatted}
                  </span>
                </div>
              )}

              {/* Catálogo */}
              {playlist.catalog_number && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Código de Catálogo</span>
                  <span className="text-white font-mono">{playlist.catalog_number}</span>
                </div>
              )}

              {/* Tags */}
              {playlist.tags && playlist.tags.length > 0 && (
                <div className="pt-2">
                  <span className="text-zinc-500 block mb-2">Clasificación:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {playlist.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] uppercase tracking-wider text-zinc-300 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Enlaces de Streaming */}
              {(playlist.spotify_url || playlist.youtube_url) && (
                <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                  <span className="text-zinc-500 block text-[11px]">Plataformas de audio:</span>
                  <div className="flex flex-col gap-2">
                    {playlist.spotify_url && (
                      <a
                        href={playlist.spotify_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between px-3 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                      >
                        <span>Escuchar en Spotify</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {playlist.youtube_url && (
                      <a
                        href={playlist.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between px-3 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                      >
                        <span>Escuchar en YouTube</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Liner Notes & Tracklist */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Título */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400">
              <span>{playlist.release_type || 'LP'}</span>
              <span>•</span>
              <Link href={`/u/${playlist.creator_username}`} className="hover:text-white transition-colors underline">
                @{playlist.creator_username}
              </Link>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white font-sans">
              {playlist.title}
            </h1>

            {playlist.upcoming_album && playlist.release_type === 'Single' && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/80 border border-zinc-700/70 space-y-1">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono uppercase tracking-widest text-zinc-200">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Sencillo / Adelanto Oficial</span>
                </div>
                <p className="text-xs text-zinc-300 font-sans">
                  Tema incluido en el próximo álbum / playlist: <strong className="text-white font-semibold">{playlist.upcoming_album}</strong>
                </p>
              </div>
            )}

            {playlist.description && (
              <p className="text-sm sm:text-base text-zinc-400 font-sans leading-relaxed">
                {playlist.description}
              </p>
            )}
          </div>

          {/* Liner Notes */}
          {playlist.story && (
            <section className="bg-[#121215]/60 backdrop-blur-md border border-zinc-800/80 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 pb-2 border-b border-zinc-800">
                <BookOpen className="w-4 h-4 text-zinc-400" />
                <span>Liner Notes & Memoria Conceptual</span>
              </div>

              <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans space-y-3 whitespace-pre-line">
                {playlist.story}
              </div>
            </section>
          )}

          {/* Tracklist con Notas */}
          <section className="bg-[#121215]/80 backdrop-blur-md border border-zinc-800 rounded-xl p-3.5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400">
                <ListMusic className="w-4 h-4 text-zinc-400" />
                <span>Tracklist & Notas por Canción</span>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {trackCount} {trackCount === 1 ? 'pista' : 'pistas'}
              </span>
            </div>

            {playlist.tracks && playlist.tracks.length > 0 ? (
              <div className="divide-y divide-zinc-800/40">
                {playlist.tracks.map((track, index) => (
                  <TrackItem key={track.id || index} track={track} index={index} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-zinc-500">
                No hay pistas registradas en este lanzamiento.
              </div>
            )}
          </section>

          {/* Navegación al Final de la Página */}
          <div className="pt-6 border-t border-zinc-800/60 flex items-center justify-end">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
            >
              <span>Subir al Inicio</span>
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
