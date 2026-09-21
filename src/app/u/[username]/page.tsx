'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Playlist, UserProfile } from '@/types';
import { getPlaylistsByCreator, getUserProfile } from '@/lib/supabase';
import { PlaylistCard } from '@/components/PlaylistCard';
import { User, Disc3, ExternalLink, ArrowLeft, Settings, Plus, ChevronUp } from 'lucide-react';

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const username = decodeURIComponent(resolvedParams.username);

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
              if (current.username?.toLowerCase() === username.toLowerCase()) {
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
      <div className="py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin mx-auto mb-4" />
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return notFound();
  }

  return (
    <div className="space-y-12">
      {/* Navegación Superior: Botón Volver */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white transition-colors bg-zinc-900/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-zinc-800 hover:border-zinc-600 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
      </div>

      {/* Cabecera de Perfil */}
      <section className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
        <div 
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none bg-zinc-400"
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-8 text-center sm:text-left">
          {/* Avatar Grande */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-black border-2 border-zinc-700 shadow-2xl flex-shrink-0 flex items-center justify-center">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName || profile.username}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-zinc-600" />
            )}
          </div>

          {/* Información */}
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500">
                <Disc3 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Perfil de Curador</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans">
                {profile.displayName || profile.username}
              </h1>
              <p className="font-mono text-xs text-zinc-400">
                @{profile.username}
              </p>
            </div>

            {profile.bio && (
              <p className="text-sm text-zinc-300 max-w-xl font-sans leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Métricas y Enlaces */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs font-mono">
              <div className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {playlists.length} {playlists.length === 1 ? 'Lanzamiento' : 'Lanzamientos'}
              </div>

              {profile.spotifyUrl && (
                <a
                  href={profile.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <span>Spotify</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {profile.lastfmUrl && (
                <a
                  href={profile.lastfmUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <span>Last.fm</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {isCurrentUser && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  <span>Editar Perfil</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Lanzamientos */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold uppercase font-mono tracking-wider text-white">
            Discografía / Lanzamientos de @{profile.username} ({playlists.length})
          </h2>

          {isCurrentUser && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lanzar Playlist</span>
            </Link>
          )}
        </div>

        {playlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
            <p className="font-mono text-xs text-zinc-500">
              Este usuario aún no ha publicado ningún lanzamiento en el repositorio.
            </p>
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
  );
}
