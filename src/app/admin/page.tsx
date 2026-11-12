'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Playlist, Track, UserProfile, ReleaseType } from '@/types';
import { getPlaylists, savePlaylist, getUserProfile } from '@/lib/supabase';
import { extractDominantColor } from '@/lib/color-extract';
import { compressImage } from '@/lib/image-compress';
import { 
  User, 
  Disc, 
  Settings, 
  Layers, 
  ArrowLeft,
  CheckCircle2,
  Lock,
  RefreshCw,
  Edit3,
  Eye,
  Save,
  UploadCloud,
  Play,
  BookOpen,
  Music,
  ExternalLink,
  Calendar,
  AlertCircle,
  LogOut,
  Tag
} from 'lucide-react';

const RELEASE_TYPES: ReleaseType[] = ['Semestral', 'LP', 'EP', 'Compilación', 'Mixtape', 'Single', 'Sesión'];

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  // Perfil
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: 'Vrak_23',
    displayName: 'Vrak23',
    email: 'rodrigodanielllanos2@gmail.com',
    bio: 'Curador sonoro y creador de Tune Tracker.',
    avatarUrl: '',
    spotifyUrl: 'https://open.spotify.com',
    lastfmUrl: 'https://www.last.fm/user/Vrak_23',
  });

  const [adminTab, setAdminTab] = useState<'playlists' | 'profile'>('playlists');

  // Datos de playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Notificaciones
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Cargar sesión inicial
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setAuthenticated(true);
          const p = await getUserProfile(data.user.username);
          if (p) setUserProfile(p);
        }
      } catch {
        const local = localStorage.getItem('canon_user_session');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed) {
              setAuthenticated(true);
              setUserProfile(parsed);
            }
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Cargar playlists de Tune Tracker al autenticar
  useEffect(() => {
    if (authenticated) {
      loadPlaylists();
    }
  }, [authenticated]);

  const loadPlaylists = async () => {
    setSyncing(true);
    try {
      const data = await getPlaylists();
      setPlaylists(data);

      // Si este dispositivo tiene datos locales (portada, notas, descripción, historia) que faltan en la nube, sincronizarlos
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
                id: target.id,
              };
              const res = await savePlaylist(toSync);
              if (res.success) {
                showNotification('✨ Cambios locales de este dispositivo sincronizados con éxito a la nube.');
                const refreshed = await getPlaylists();
                setPlaylists(refreshed);
              }
            }
          }
        } catch (e) {
          console.warn('Error en autosync:', e);
        }
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!passwordInput.trim()) {
      setAuthError('Por favor ingresa la clave de curador.');
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAuthenticated(true);
        const p = await getUserProfile('Vrak_23');
        if (p) setUserProfile(p);
        localStorage.setItem('canon_user_session', JSON.stringify(p || data.user));
        notifyAuthChange();
        showNotification('¡Acceso concedido al Estudio!');
      } else {
        setAuthError(data.error || 'Clave incorrecta.');
      }
    } catch {
      if (passwordInput === 'canon123' || passwordInput === 'xplegend23' || passwordInput === 'canon') {
        setAuthenticated(true);
        const p = await getUserProfile('Vrak_23');
        if (p) setUserProfile(p);
        notifyAuthChange();
        showNotification('¡Acceso concedido!');
      } else {
        setAuthError('Error de autenticación.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch {}
    localStorage.removeItem('canon_user_session');
    setAuthenticated(false);
    setPasswordInput('');
    notifyAuthChange();
    showNotification('Sesión cerrada.');
  };

  const notifyAuthChange = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('canon_auth_change'));
    }
  };

  // Abrir editor de personalización
  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist({
      ...playlist,
      tracks: playlist.tracks ? playlist.tracks.map(t => ({ ...t })) : [],
      tags: playlist.tags ? [...playlist.tags] : ['TUNE TRACKER', 'CURADURÍA']
    });
    setTagInput((playlist.tags || []).join(', '));
    setIsFormOpen(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Subir portada de playlist
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPlaylist) return;

    try {
      const optimizedBase64 = await compressImage(file, 800, 0.85);
      const color = await extractDominantColor(optimizedBase64);
      
      setEditingPlaylist({
        ...editingPlaylist,
        cover_url: optimizedBase64,
        dominant_color: color
      });
      showNotification('Portada optimizada y halo ambiental calculado.');
    } catch {
      showNotification('Error al procesar la imagen.');
    }
  };

  // Subir avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimizedBase64 = await compressImage(file, 400, 0.85);
      setUserProfile((prev) => ({ ...prev, avatarUrl: optimizedBase64 }));
      showNotification('Foto de perfil optimizada.');
    } catch {
      showNotification('Error al procesar la foto.');
    }
  };

  // Guardar perfil
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('canon_profile_vrak_23', JSON.stringify(userProfile));
    localStorage.setItem('canon_user_session', JSON.stringify(userProfile));
    notifyAuthChange();
    showNotification('Perfil actualizado con éxito.');
  };

  // Guardar personalizaciones de la playlist
  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist) return;

    if (!editingPlaylist.title.trim()) {
      alert('El título de la playlist es requerido.');
      return;
    }

    const parsedTags = tagInput
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);

    const playlistToSave: Playlist = {
      ...editingPlaylist,
      tags: parsedTags.length > 0 ? parsedTags : ['TUNE TRACKER'],
      updated_at: new Date().toISOString(),
    };

    const res = await savePlaylist(playlistToSave);

    if (res.success) {
      await loadPlaylists();
      setIsFormOpen(false);
      setEditingPlaylist(null);
      showNotification('¡Personalización guardada y sincronizada!');
    } else {
      alert('Error al guardar: ' + res.error);
    }
  };

  // Modificar notas de una canción específica
  const handleUpdateTrackNote = (index: number, note: string) => {
    if (!editingPlaylist || !editingPlaylist.tracks) return;
    const updated = [...editingPlaylist.tracks];
    updated[index] = { ...updated[index], notes: note };
    setEditingPlaylist({ ...editingPlaylist, tracks: updated });
  };

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto mb-4" />
        <p className="font-mono text-xs text-[#8c8c96] uppercase tracking-[0.2em]">Verificando sesión...</p>
      </div>
    );
  }

  // Vista de Acceso / Login Estilo Tidal
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto py-12 sm:py-16 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8c8c96] hover:text-white transition-colors bg-[#0e0e13] border border-white/[0.08] px-4 py-2 rounded-full hover:border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Catálogo</span>
          </button>
        </div>

        <div className="bg-[#0d0d12] border border-white/[0.08] rounded-2xl p-7 sm:p-9 space-y-6 shadow-2xl">
          <div className="text-center space-y-2.5">
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-black mx-auto shadow-inner">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Estudio de Curaduría
            </h1>
            <p className="text-xs text-[#8c8c96] font-mono leading-relaxed">
              Acceso exclusivo para personalizar y enriquecer las playlists de Tune Tracker.
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1.5">
                Contraseña de Curador:
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Ingresa tu clave de acceso"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-[#060608] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-white/40 transition-colors placeholder-[#555560] font-mono"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-900/60">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(255,255,255,0.25)]"
            >
              <span>Acceder al Estudio</span>
            </button>
          </form>

          <div className="p-3.5 bg-black/50 border border-white/[0.06] rounded-xl text-[11px] font-mono text-[#8c8c96] space-y-1">
            <span className="text-zinc-500 block uppercase tracking-wider">Curador Registrado:</span>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Usuario: <strong className="text-white font-mono">@Vrak_23</strong></span>
              <span>Clave por defecto: <strong className="text-white font-mono">canon123</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Notificación Flotante */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-white text-black font-mono text-xs font-semibold shadow-2xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Barra de Retroceso y Navegación del Estudio */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <button
          onClick={() => router.push('/')}
          className="h-9 px-3 sm:px-4 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8c8c96] hover:text-white transition-colors bg-[#0e0e13] border border-white/[0.08] rounded-full hover:border-white/20 shadow-md flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver<span className="hidden sm:inline"> al Catálogo</span></span>
        </button>

        <Link
          href={`/u/${userProfile.username}`}
          className="h-9 px-3 sm:px-4 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8c8c96] hover:text-white transition-colors bg-[#0e0e13] border border-white/[0.08] rounded-full hover:border-white/20 shadow-md flex-shrink-0"
        >
          <Eye className="w-3.5 h-3.5 text-zinc-400" />
          <span><span className="hidden sm:inline">Ver </span>Mi Perfil</span>
          <ExternalLink className="w-3 h-3 text-zinc-500" />
        </Link>
      </div>

      {/* Cabecera del Estudio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3.5">
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-black border border-white/20 flex-shrink-0 flex items-center justify-center">
            {userProfile.avatarUrl ? (
              <Image src={userProfile.avatarUrl} alt="Avatar" fill unoptimized className="object-cover" />
            ) : (
              <User className="w-5 h-5 text-[#70707a]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#8c8c96] mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(0,240,255,0.7)] flex-shrink-0"></span>
              <span className="truncate">Conectado a Supabase</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white font-sans">
              Estudio de Personalización
            </h1>
          </div>
        </div>

        {/* Selector de Pestañas y Acciones */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          <div className="flex flex-1 sm:flex-initial bg-[#0d0d12] border border-white/[0.08] rounded-full p-1">
            <button
              onClick={() => { setAdminTab('playlists'); setIsFormOpen(false); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all ${
                adminTab === 'playlists' ? 'bg-white text-black font-semibold shadow-md' : 'text-[#8c8c96] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Playlists</span>
            </button>
            <button
              onClick={() => { setAdminTab('profile'); setIsFormOpen(false); }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all ${
                adminTab === 'profile' ? 'bg-white text-black font-semibold shadow-md' : 'text-[#8c8c96] hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Mi Perfil</span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full bg-[#0d0d12] border border-white/[0.08] text-[#8c8c96] hover:text-red-400 hover:border-red-400/40 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FORMULARIO DE PERSONALIZACIÓN DE PLAYLIST */}
      {/* ======================================================== */}
      {isFormOpen && editingPlaylist && (
        <div className="bg-[#0d0d12] border border-white/[0.08] rounded-2xl p-4 sm:p-7 space-y-6 sm:space-y-8 shadow-2xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1 font-semibold">
                <Edit3 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="truncate">Personalizando Selección</span>
                {editingPlaylist.period_str && (
                  <>
                    <span className="text-zinc-600 hidden xs:inline">•</span>
                    <span className="text-zinc-300 font-semibold hidden xs:inline">{editingPlaylist.period_str}</span>
                  </>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white font-sans">
                {editingPlaylist.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setEditingPlaylist(null); }}
                className="w-full sm:w-auto h-9 px-4 rounded-xl sm:rounded-full border border-white/[0.08] bg-[#16161d] text-[#8c8c96] hover:text-white text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                Cerrar
              </button>
            </div>
          </div>

          <form onSubmit={handleSavePlaylist} className="space-y-8">
            {/* 1. Metadatos Principales */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#8c8c96] flex items-center gap-2 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>1. Ficha del Lanzamiento</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1.5">
                    Título de la Playlist / Lanzamiento:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPlaylist.title}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#060608] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1.5">
                    Slug / Enlace URL:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPlaylist.slug}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, slug: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#060608] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1.5">
                    Formato de Lanzamiento:
                  </label>
                  <select
                    value={editingPlaylist.release_type}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, release_type: e.target.value as ReleaseType })}
                    className="w-full px-4 py-2.5 bg-[#060608] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                  >
                    {RELEASE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1.5">
                    Fecha de Lanzamiento:
                  </label>
                  <input
                    type="date"
                    value={editingPlaylist.release_date}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, release_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#060608] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1.5">
                    Código de Catálogo:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. TT-2026-02"
                    value={editingPlaylist.catalog_number || ''}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, catalog_number: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#060608] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1.5">
                  Descripción Corta:
                </label>
                <textarea
                  rows={2}
                  value={editingPlaylist.description || ''}
                  onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                  placeholder="Resumen introductorio del lanzamiento..."
                  className="w-full px-4 py-2.5 bg-[#060608] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors font-sans"
                />
              </div>
            </div>

            {/* 2. Portada & Ambient Glow */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#8c8c96] flex items-center gap-2 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>2. Portada & Resplandor Ambiental (Ambient Glow)</span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Portada Preview */}
                <div className="relative aspect-square w-40 sm:w-48 rounded-xl overflow-hidden bg-[#060608] border border-white/[0.12] flex-shrink-0 flex items-center justify-center shadow-2xl">
                  {editingPlaylist.cover_url ? (
                    <Image src={editingPlaylist.cover_url} alt="Portada" fill unoptimized className="object-cover" />
                  ) : (
                    <Disc className="w-12 h-12 text-[#3a3a44]" />
                  )}
                </div>

                <div className="space-y-4 flex-1 w-full">
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 px-4 rounded-xl sm:rounded-full bg-white text-black font-semibold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(255,255,255,0.2)] hover:bg-zinc-200"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Subir Portada</span>
                      </button>
                      {editingPlaylist.cover_url && (
                        <button
                          type="button"
                          onClick={() => setEditingPlaylist({ ...editingPlaylist, cover_url: '', dominant_color: '#262626' })}
                          className="h-10 px-4 rounded-xl sm:rounded-full bg-[#181820] border border-white/[0.08] text-xs font-mono text-[#8c8c96] hover:text-red-400 flex items-center justify-center"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#70707a] font-sans">
                      Comprime automáticamente la imagen y extrae el resplandor ambiental.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1">
                      O pegar URL directa de imagen:
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editingPlaylist.cover_url || ''}
                      onChange={async (e) => {
                        const url = e.target.value;
                        let color = editingPlaylist.dominant_color;
                        if (url && url.startsWith('http')) {
                          try { color = await extractDominantColor(url); } catch {}
                        }
                        setEditingPlaylist({ ...editingPlaylist, cover_url: url, dominant_color: color });
                      }}
                      className="w-full px-4 py-2 bg-[#060608] border border-white/[0.1] rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Color dominante */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border border-white/30 shadow-md"
                      style={{ backgroundColor: editingPlaylist.dominant_color || '#262626' }}
                    />
                    <span className="text-xs font-mono text-[#8c8c96]">Color Ambiental Extraído:</span>
                    <input
                      type="text"
                      value={editingPlaylist.dominant_color || '#262626'}
                      onChange={(e) => setEditingPlaylist({ ...editingPlaylist, dominant_color: e.target.value })}
                      className="w-24 px-2 py-1 bg-[#060608] border border-white/[0.1] rounded-lg text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Liner Notes & Historia */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8c8c96] flex items-center gap-2 font-semibold">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3. Liner Notes & Memoria Conceptual</span>
                </h3>
                <span className="text-[11px] font-mono text-[#6e6e78]">Texto largo para la historia del ciclo</span>
              </div>

              <textarea
                rows={5}
                value={editingPlaylist.story || ''}
                onChange={(e) => setEditingPlaylist({ ...editingPlaylist, story: e.target.value })}
                placeholder="Escribe la historia detrás de este ciclo o lanzamiento..."
                className="w-full px-4 py-3 bg-[#060608] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 font-sans leading-relaxed"
              />
            </div>

            {/* 4. Enlaces y Etiquetas */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#8c8c96] flex items-center gap-2 font-semibold">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>4. Plataformas Externas & Etiquetas</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1">
                    Enlace de la Playlist en Spotify:
                  </label>
                  <input
                    type="url"
                    placeholder="https://open.spotify.com/playlist/..."
                    value={editingPlaylist.spotify_url || ''}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, spotify_url: e.target.value })}
                    className="w-full px-4 py-2 bg-[#060608] border border-white/[0.1] rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1">
                    Enlace de la Playlist en YouTube:
                  </label>
                  <input
                    type="url"
                    placeholder="https://music.youtube.com/playlist?list=..."
                    value={editingPlaylist.youtube_url || ''}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, youtube_url: e.target.value })}
                    className="w-full px-4 py-2 bg-[#060608] border border-white/[0.1] rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1">
                    Etiquetas / Géneros (separadas por coma):
                  </label>
                  <input
                    type="text"
                    placeholder="TUNE TRACKER, METAL, ROCK, FAVORITOS"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="w-full px-4 py-2 bg-[#060608] border border-white/[0.1] rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* 5. Tracklist de Tune Tracker & Notas de Curaduría */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#8c8c96] flex items-center gap-2 font-semibold">
                    <Music className="w-3.5 h-3.5 text-cyan-400" />
                    <span>5. Tracklist de Tune Tracker & Notas por Canción</span>
                  </h3>
                  <p className="text-xs text-[#6e6e78] font-sans mt-0.5">
                    Canciones sincronizadas desde tu selección en Tune Tracker. Añade una nota personal a cada tema.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#8c8c96]">
                  {editingPlaylist.tracks?.length || 0} canciones
                </span>
              </div>

              <div className="space-y-3">
                {editingPlaylist.tracks && editingPlaylist.tracks.length > 0 ? (
                  editingPlaylist.tracks.map((track, idx) => (
                    <div 
                      key={track.id || idx}
                      className="p-4 rounded-xl bg-[#060608] border border-white/[0.08] space-y-2.5 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="font-mono text-xs text-[#6e6e78] w-5 pt-0.5 flex-shrink-0">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">{track.title}</p>
                            <p className="text-[11px] text-[#8c8c96] truncate">
                              {track.artist} {track.album && `• ${track.album}`}
                            </p>
                          </div>
                        </div>

                        {track.plays !== undefined && track.plays > 0 && (
                          <div className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#121217] border border-white/[0.08] text-[10px] font-mono text-zinc-300">
                            <Play className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
                            <span>{track.plays}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Escribe una nota curatorial para este tema..."
                          value={track.notes || ''}
                          onChange={(e) => handleUpdateTrackNote(idx, e.target.value)}
                          className="w-full px-3.5 py-2 bg-[#0c0c10] border border-white/[0.08] rounded-lg text-xs text-zinc-200 placeholder-[#555560] focus:outline-none focus:border-cyan-400/80 font-sans italic"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-[#6e6e78]">
                    No hay pistas cargadas en esta playlist.
                  </div>
                )}
              </div>
            </div>

            {/* Botón de Guardado */}
            <div className="pt-6 border-t border-white/[0.08] flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setEditingPlaylist(null); }}
                className="h-11 sm:h-10 px-5 rounded-xl sm:rounded-full bg-[#16161d] border border-white/[0.08] text-xs font-mono uppercase text-[#8c8c96] hover:text-white transition-colors flex items-center justify-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-11 sm:h-10 px-6 rounded-xl sm:rounded-full bg-white text-black font-bold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(255,255,255,0.25)]"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Personalización</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA: MIS PLAYLISTS DE TUNE TRACKER */}
      {/* ======================================================== */}
      {adminTab === 'playlists' && !isFormOpen && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Playlists Sincronizadas desde Tune Tracker ({playlists.length})</span>
              </h2>
              <p className="text-xs text-[#8c8c96] font-sans mt-0.5">
                Tabla <code className="text-zinc-300 font-mono">spotitracker_curator</code> en Supabase.
              </p>
            </div>

            <button
              onClick={loadPlaylists}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0d0d12] border border-white/[0.08] hover:border-white/20 text-xs font-mono text-[#8c8c96] hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sincronizar ahora</span>
            </button>
          </div>

          <div className="space-y-4">
            {playlists.length > 0 ? (
              playlists.map((playlist) => {
                const totalStreams = (playlist.tracks || []).reduce((acc, t) => acc + (t.plays || 0), 0);
                const notesCount = (playlist.tracks || []).filter(t => t.notes && t.notes.trim().length > 0).length;

                return (
                  <div
                    key={playlist.id}
                    className="p-5 rounded-2xl bg-[#0d0d12] border border-white/[0.08] hover:border-white/[0.2] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      {/* Portada Mini */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0 flex items-center justify-center">
                        {playlist.cover_url ? (
                          <Image src={playlist.cover_url} alt="Cover" fill unoptimized className="object-cover" />
                        ) : (
                          <Disc className="w-8 h-8 text-[#454550]" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-mono uppercase text-[#8c8c96]">
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-white">
                            {playlist.release_type || 'Semestral'}
                          </span>
                          {playlist.period_str && (
                            <>
                              <span>•</span>
                              <span>{playlist.period_str}</span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white font-sans">
                          {playlist.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs font-mono text-[#6e6e78]">
                          <span>{playlist.tracks?.length || 0} canciones</span>
                          {totalStreams > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-cyan-400 flex items-center gap-1">
                                <Play className="w-2.5 h-2.5 fill-cyan-400" />
                                {totalStreams.toLocaleString('es-ES')} streams
                              </span>
                            </>
                          )}
                          {notesCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-300">{notesCount} notas escritas</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                      <Link
                        href={`/playlist/${playlist.slug}`}
                        className="h-10 px-4 rounded-xl sm:rounded-full bg-[#16161d] border border-white/[0.08] text-xs font-mono text-[#8c8c96] hover:text-white transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Vista Pública</span>
                      </Link>

                      <button
                        onClick={() => handleEdit(playlist)}
                        className="h-10 px-5 rounded-xl sm:rounded-full bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Personalización</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center border border-dashed border-white/[0.08] rounded-2xl bg-[#0a0a0e] space-y-3">
                <Disc className="w-10 h-10 text-[#3a3a44] mx-auto" />
                <p className="font-mono text-xs text-[#8c8c96]">
                  No se encontraron playlists en la base de datos de Tune Tracker.
                </p>
                <button
                  onClick={loadPlaylists}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#121217] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar Sincronización</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA: PERFIL DEL CURADOR */}
      {/* ======================================================== */}
      {adminTab === 'profile' && !isFormOpen && (
        <div className="max-w-2xl bg-[#0d0d12] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="pb-4 border-b border-white/[0.08]">
            <h2 className="text-base font-bold uppercase font-mono tracking-wider text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Perfil de Curador</span>
            </h2>
            <p className="text-xs text-[#8c8c96] font-sans mt-1">
              Personaliza tu presentación pública en Molva.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-2">
                Foto de Perfil / Avatar:
              </label>
              <div className="flex items-center gap-5">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-black border border-white/20 flex-shrink-0 flex items-center justify-center">
                  {userProfile.avatarUrl ? (
                    <Image src={userProfile.avatarUrl} alt="Avatar" fill unoptimized className="object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-[#50505a]" />
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-4 py-2 rounded-full bg-[#16161d] border border-white/[0.1] hover:border-white/30 text-xs font-mono text-zinc-200 transition-colors flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Subir Foto</span>
                    </button>
                    {userProfile.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setUserProfile((prev) => ({ ...prev, avatarUrl: '' }))}
                        className="px-3 py-2 rounded-full bg-[#16161d] border border-white/[0.08] text-xs font-mono text-[#8c8c96] hover:text-red-400"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    placeholder="O pegar URL de imagen..."
                    value={userProfile.avatarUrl || ''}
                    onChange={(e) => setUserProfile({ ...userProfile, avatarUrl: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#060608] border border-white/[0.1] rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1">
                  Nombre Público:
                </label>
                <input
                  type="text"
                  value={userProfile.displayName || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, displayName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#060608] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1">
                  Usuario (@):
                </label>
                <input
                  type="text"
                  disabled
                  value={userProfile.username}
                  className="w-full px-3.5 py-2 bg-[#060608] border border-white/[0.04] rounded-xl text-xs font-mono text-[#60606a] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1">
                  Enlace de Spotify:
                </label>
                <input
                  type="url"
                  placeholder="https://open.spotify.com/user/..."
                  value={userProfile.spotifyUrl || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, spotifyUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#060608] border border-white/[0.1] rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1">
                  Enlace de Last.fm:
                </label>
                <input
                  type="url"
                  placeholder="https://www.last.fm/user/Vrak_23"
                  value={userProfile.lastfmUrl || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, lastfmUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#060608] border border-white/[0.1] rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#8c8c96] mb-1">
                Biografía del Curador:
              </label>
              <textarea
                rows={3}
                value={userProfile.bio || ''}
                onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#060608] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto h-11 sm:h-10 px-6 rounded-xl sm:rounded-full bg-white text-black font-bold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(255,255,255,0.2)]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
