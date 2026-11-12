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
  ChevronUp,
  Play,
  Settings,
  Tag
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
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="font-mono text-xs text-[#8c8c96] uppercase tracking-[0.2em]">Cargando lanzamiento...</p>
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
  const totalStreams = (playlist.tracks || []).reduce((acc, t) => acc + (t.plays || 0), 0);

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
    <div className="relative space-y-8 sm:space-y-12">
      {/* Halo de fondo ambiental difuminado adaptado a la portada */}
      <AmbientGlow 
        color={playlist.dominant_color} 
        imageUrl={playlist.cover_url} 
        opacity={0.30} 
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

      {/* Barra de Navegación Superior: Botón Volver y Acciones */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8c8c96] hover:text-white transition-all bg-[#0e0e13]/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/[0.08] hover:border-white/20 shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Catálogo</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8c8c96] hover:text-white transition-all bg-[#0e0e13]/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/[0.08] hover:border-white/20"
            title="Personalizar en Estudio"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Personalizar</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8c8c96] hover:text-white transition-all bg-[#0e0e13]/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/[0.08] hover:border-white/20"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-white">Copiado</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cabecera Estilo Tidal Album Hero */}
      <section className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 lg:gap-10 pt-2 pb-6 border-b border-white/[0.08]">
        {/* Portada Principal */}
        <div className="group relative w-48 h-48 sm:w-60 sm:h-60 lg:w-72 lg:h-72 rounded-xl overflow-hidden bg-[#101015] border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex-shrink-0">
          {playlist.cover_url ? (
            <>
              <Image
                src={playlist.cover_url}
                alt={playlist.title}
                fill
                priority
                sizes="(max-width: 768px) 240px, 288px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <button
                onClick={() => setArtworkOpen(true)}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Expandir artwork"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#555560] space-y-3 bg-[#0a0a0e]">
              <Disc className="w-16 h-16 text-[#33333d]" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#707080]">Tune Tracker</span>
            </div>
          )}
        </div>

        {/* Metadatos Principales del Álbum / Lanzamiento */}
        <div className="flex-1 space-y-3 sm:space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono uppercase tracking-[0.18em] text-[#8c8c96]">
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white font-semibold text-[10px]">
              {playlist.release_type || 'Semestral'}
            </span>
            {playlist.period_str && (
              <>
                <span>•</span>
                <span className="text-zinc-300">{playlist.period_str}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-sans leading-tight">
            {playlist.title}
          </h1>

          {/* Curador y Métricas en Línea */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-xs sm:text-sm text-[#8c8c96] font-sans">
            <Link
              href={`/u/${playlist.creator_username}`}
              className="text-white hover:text-cyan-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              {playlist.creator_avatar ? (
                <div className="relative w-5 h-5 rounded-full overflow-hidden border border-zinc-700">
                  <Image src={playlist.creator_avatar} alt="Avatar" fill className="object-cover" />
                </div>
              ) : (
                <User className="w-4 h-4 text-[#6c6c76]" />
              )}
              <span>@{playlist.creator_username}</span>
            </Link>

            <span className="text-zinc-700">•</span>
            <span className="font-mono text-zinc-300">{releaseDateFormatted}</span>

            <span className="text-zinc-700">•</span>
            <span className="font-mono text-zinc-300">{trackCount} canciones</span>

            {durationFormatted && (
              <>
                <span className="text-zinc-700">•</span>
                <span className="font-mono text-zinc-300">{durationFormatted}</span>
              </>
            )}

            {totalStreams > 0 && (
              <>
                <span className="text-zinc-700">•</span>
                <span className="font-mono text-cyan-400 flex items-center gap-1">
                  <Play className="w-3 h-3 fill-cyan-400" />
                  {totalStreams.toLocaleString('es-ES')} streams
                </span>
              </>
            )}
          </div>

          {playlist.description && (
            <p className="text-xs sm:text-sm text-[#8c8c96] font-sans leading-relaxed max-w-2xl pt-1">
              {playlist.description}
            </p>
          )}

          {/* Botones de Escucha en Plataformas */}
          {(playlist.spotify_url || playlist.youtube_url) && (
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              {playlist.spotify_url && (
                <a
                  href={playlist.spotify_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-[0_0_16px_rgba(255,255,255,0.25)]"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Escuchar en Spotify</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
              {playlist.youtube_url && (
                <a
                  href={playlist.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#121217] border border-white/[0.12] hover:border-white/30 text-white font-semibold text-xs font-mono uppercase tracking-wider transition-all"
                >
                  <span>YouTube Music</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Estructura Principal: Ficha Técnica & Tracklist */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Columna Lateral: Ficha Técnica & Liner Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Ficha Técnica Tidal */}
          <div className="bg-[#0d0d12] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="text-xs font-mono uppercase tracking-[0.16em] text-[#8c8c96] pb-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Ficha Discográfica</span>
              </div>
              <span className="text-[10px] text-zinc-400">{playlist.catalog_number || 'TT-01'}</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between text-[#8c8c96]">
                <span>Formato</span>
                <span className="text-white">{playlist.release_type || 'Semestral'}</span>
              </div>

              {playlist.cycle_year && (
                <div className="flex items-center justify-between text-[#8c8c96]">
                  <span>Ciclo Anual</span>
                  <span className="text-white">{playlist.cycle_year} ({playlist.cycle_half === '1' ? '1ra Mitad' : '2da Mitad'})</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[#8c8c96]">
                <span>Pistas Totales</span>
                <span className="text-white">{trackCount} canciones</span>
              </div>

              {totalStreams > 0 && (
                <div className="flex items-center justify-between text-[#8c8c96]">
                  <span>Reproducciones</span>
                  <span className="text-cyan-400 font-bold">{totalStreams.toLocaleString('es-ES')}</span>
                </div>
              )}

              {/* Tags */}
              {playlist.tags && playlist.tags.length > 0 && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <span className="text-[#656570] block mb-2 text-[11px]">Etiquetas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {playlist.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] uppercase tracking-wider text-zinc-300 bg-[#16161d] border border-white/[0.08] px-2.5 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Liner Notes & Memoria Conceptual */}
          {playlist.story && (
            <section className="bg-[#0d0d12] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-[#8c8c96] pb-3 border-b border-white/[0.06]">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Liner Notes & Memoria</span>
              </div>

              <div className="text-xs sm:text-sm text-[#c8c8d2] leading-relaxed font-sans space-y-3 whitespace-pre-line">
                {playlist.story}
              </div>
            </section>
          )}
        </div>

        {/* Columna Principal: Tracklist Estilo Tabla Tidal */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#0d0d12] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-2 shadow-xl">
            {/* Cabecera de Columnas Estilo Tidal */}
            <div className="flex items-center justify-between px-3 sm:px-4 pb-3 border-b border-white/[0.06] text-[11px] font-mono uppercase tracking-wider text-[#6e6e78]">
              <div className="flex items-center gap-4">
                <span className="w-6 text-right">#</span>
                <span>Título / Artista</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Streams</span>
                <span className="hidden sm:inline w-12 text-right">Tiempo</span>
              </div>
            </div>

            {/* Pistas */}
            {playlist.tracks && playlist.tracks.length > 0 ? (
              <div className="divide-y divide-white/[0.03] pt-1">
                {playlist.tracks.map((track, index) => (
                  <TrackItem key={track.id || index} track={track} index={index} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-mono text-[#6e6e78]">
                No hay canciones registradas en este lanzamiento.
              </div>
            )}
          </div>

          {/* Botón Subir */}
          <div className="pt-4 flex items-center justify-end">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8c8c96] hover:text-white transition-colors py-2 px-4 rounded-full bg-[#0d0d12] border border-white/[0.08] hover:border-white/20"
            >
              <span>Subir al Inicio</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
