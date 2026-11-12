'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Playlist, UserProfile } from '@/types';
import { getPlaylistsByCreator, getUserProfile } from '@/lib/supabase';
import { PlaylistCard } from '@/components/PlaylistCard';
import { User, ExternalLink, ArrowLeft, Settings, ChevronUp, Sparkles, Disc } from 'lucide-react';

export default function UserProfilePage() {
  const router = useRouter();
  const routeParams = useParams();
  const rawUsername = (routeParams?.username as string) || '';
  const username = decodeURIComponent(rawUsername);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const p = await getUserProfile(username);
        const userPlaylists = await getPlaylistsByCreator(username);
        setProfile(p);
        setPlaylists(userPlaylists);

        if (typeof window !== 'undefined') {
          const session = localStorage.getItem('canon_user_session');
          if (session) {
            try {
              const current = JSON.parse(session);
              if (current.username?.toLowerCase() === username.toLowerCase() || username.toLowerCase() === 'vrak_23') {
                setIsCurrentUser(true);
              }
            } catch {}
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto mb-4" />
        <p className="font-mono text-xs text-[#8c8c96] uppercase tracking-[0.2em]">Cargando perfil de curador...</p>
      </div>
    );
  }

  if (!profile) {
    return notFound();
  }

  const totalStreams = playlists.reduce((acc, p) => acc + (p.tracks || []).reduce((tAcc, t) => tAcc + (t.plays || 0), 0), 0);

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Navegación Superior: Botón Volver */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8c8c96] hover:text-white transition-all bg-[#0e0e13]/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/[0.08] hover:border-white/20 shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver</span>
        </button>
      </div>

      {/* Cabecera de Perfil Estilo Tidal Artist */}
      <section className="bg-[#0d0d12] border border-white/[0.08] rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
        <div 
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] opacity-25 pointer-events-none bg-cyan-500/20"
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10 text-center sm:text-left">
          {/* Avatar Grande */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden bg-[#14141a] border-2 border-white/20 shadow-[0_12px_30px_rgba(0,0,0,0.8)] flex-shrink-0 flex items-center justify-center">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName || profile.username}
                fill
                priority
                unoptimized={profile.avatarUrl.startsWith('data:')}
                className="object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-[#555560]" />
            )}
          </div>

          {/* Información */}
          <div className="flex-1 space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.7)]" />
                <span>Curador Principal • Tune Tracker</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-sans">
                {profile.displayName || profile.username}
              </h1>

              <p className="font-mono text-xs text-[#8c8c96]">
                @{profile.username}
              </p>
            </div>

            {profile.bio && (
              <p className="text-xs sm:text-sm text-[#b0b0ba] max-w-2xl font-sans leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Métricas y Enlaces */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs font-mono">
              <div className="px-3.5 py-1.5 rounded-full bg-[#16161d] border border-white/[0.08] text-white">
                <strong className="text-cyan-400">{playlists.length}</strong> {playlists.length === 1 ? 'Lanzamiento' : 'Lanzamientos'}
              </div>

              {totalStreams > 0 && (
                <div className="px-3.5 py-1.5 rounded-full bg-[#16161d] border border-white/[0.08] text-white">
                  <strong className="text-cyan-400">{totalStreams.toLocaleString('es-ES')}</strong> Streams acumulados
                </div>
              )}

              {profile.spotifyUrl && (
                <a
                  href={profile.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#16161d] border border-white/[0.08] text-[#8c8c96] hover:text-white transition-colors"
                >
                  <span>Spotify</span>
                  <ExternalLink className="w-3 h-3 text-[#6e6e78]" />
                </a>
              )}

              {profile.lastfmUrl && (
                <a
                  href={profile.lastfmUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#16161d] border border-white/[0.08] text-[#8c8c96] hover:text-white transition-colors"
                >
                  <span>Last.fm</span>
                  <ExternalLink className="w-3 h-3 text-[#6e6e78]" />
                </a>
              )}

              {isCurrentUser && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors shadow-md"
                >
                  <Settings className="w-3 h-3" />
                  <span>Estudio</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Lanzamientos Curados */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] gap-3 flex-wrap">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
            Discografía / Lanzamientos Curados ({playlists.length})
          </h2>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8c8c96] hover:text-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Personalizar en Estudio</span>
          </Link>
        </div>

        {playlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-white/[0.08] rounded-2xl bg-[#0a0a0e] space-y-3">
            <Disc className="w-12 h-12 text-[#33333d] mx-auto" />
            <p className="font-mono text-xs text-[#8c8c96]">
              No hay selecciones sincronizadas en este momento.
            </p>
          </div>
        )}
      </section>

      {/* Navegación al Final de la Página */}
      <div className="pt-6 border-t border-white/[0.06] flex items-center justify-end">
        <button
          onClick={scrollToTop}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8c8c96] hover:text-white transition-colors py-2 px-4 rounded-full bg-[#0d0d12] border border-white/[0.08] hover:border-white/20"
        >
          <span>Subir al Inicio</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
