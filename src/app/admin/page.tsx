'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Playlist, Track, UserProfile, ReleaseType } from '@/types';
import { getPlaylists, savePlaylist, deletePlaylist, getUserProfile } from '@/lib/supabase';
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
      // Fallback local
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

    // Procesar tags
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
      <div className="py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin mx-auto mb-4" />
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Verificando sesión...</p>
      </div>
    );
  }

  // Vista de Acceso / Login
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-md hover:border-zinc-600"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Catálogo</span>
          </button>
        </div>

        <div className="bg-[#121215] border border-zinc-800 rounded-xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center bg-black mx-auto">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white font-sans">
              Estudio de Curaduría
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              Acceso exclusivo para personalizar y enriquecer las playlists provenientes de Tune Tracker.
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                Contraseña de Administrador / Curador:
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Ingresa tu clave de acceso"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors placeholder-zinc-600 font-mono"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-950/40 p-2.5 rounded border border-red-900/60">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              <span>Acceder al Estudio</span>
            </button>
          </form>

          <div className="p-3 bg-black/60 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-400 space-y-1">
            <span className="text-zinc-500 block uppercase">Curador Configurado:</span>
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
    <div className="space-y-8">
      {/* Notificación Flotante */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black font-mono text-xs font-semibold shadow-2xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Barra de Retroceso y Navegación del Estudio */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-md hover:border-zinc-600 shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Catálogo</span>
        </button>

        <Link
          href={`/u/${userProfile.username}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          <span>Ver mi Perfil Público</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Cabecera del Estudio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-black border border-zinc-700 flex-shrink-0 flex items-center justify-center">
            {userProfile.avatarUrl ? (
              <Image src={userProfile.avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <User className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Conectado a Base de Datos Supabase (Tune Tracker)</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white font-sans">
                Estudio de Personalización
              </h1>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas y Acciones */}
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => { setAdminTab('playlists'); setIsFormOpen(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                adminTab === 'playlists' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Playlists Tune Tracker</span>
            </button>
            <button
              onClick={() => { setAdminTab('profile'); setIsFormOpen(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                adminTab === 'profile' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Mi Perfil</span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
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
        <div className="bg-[#121215] border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-8 shadow-2xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Personalizando Selección de Tune Tracker</span>
                {editingPlaylist.period_str && (
                  <>
                    <span>•</span>
                    <span className="text-zinc-300 font-semibold">{editingPlaylist.period_str}</span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                {editingPlaylist.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setEditingPlaylist(null); }}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>

          <form onSubmit={handleSavePlaylist} className="space-y-8">
            {/* 1. Metadatos Principales */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                <span>1. Ficha del Lanzamiento</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Título de la Playlist / Lanzamiento:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPlaylist.title}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Slug / Enlace URL:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPlaylist.slug}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Formato de Lanzamiento:
                  </label>
                  <select
                    value={editingPlaylist.release_type}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, release_type: e.target.value as ReleaseType })}
                    className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 font-mono"
                  >
                    {RELEASE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Fecha de Lanzamiento:
                  </label>
                  <input
                    type="date"
                    value={editingPlaylist.release_date}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, release_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                    Código de Catálogo:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. TT-2026-02"
                    value={editingPlaylist.catalog_number || ''}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, catalog_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Descripción Corta:
                </label>
                <textarea
                  rows={2}
                  value={editingPlaylist.description || ''}
                  onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                  placeholder="Resumen introductorio del lanzamiento..."
                  className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 font-sans"
                />
              </div>
            </div>

            {/* 2. Portada & Ambient Glow */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                <span>2. Portada & Resplandor Ambiental (Ambient Glow)</span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Portada Preview */}
                <div className="relative aspect-square w-40 sm:w-48 rounded-xl overflow-hidden bg-black border border-zinc-700 flex-shrink-0 flex items-center justify-center">
                  {editingPlaylist.cover_url ? (
                    <Image src={editingPlaylist.cover_url} alt="Portada" fill className="object-cover" />
                  ) : (
                    <Disc className="w-12 h-12 text-zinc-700" />
                  )}
                </div>

                <div className="space-y-4 flex-1 w-full">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-mono text-white transition-colors flex items-center gap-2"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Subir Portada (Auto-comprimir & Extraer Color)</span>
                    </button>
                    {editingPlaylist.cover_url && (
                      <button
                        type="button"
                        onClick={() => setEditingPlaylist({ ...editingPlaylist, cover_url: '', dominant_color: '#262626' })}
                        className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-red-400"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
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
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  {/* Color dominante */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border border-zinc-600 shadow-md"
                      style={{ backgroundColor: editingPlaylist.dominant_color || '#262626' }}
                    />
                    <span className="text-xs font-mono text-zinc-400">Color Ambiental Extraído:</span>
                    <input
                      type="text"
                      value={editingPlaylist.dominant_color || '#262626'}
                      onChange={(e) => setEditingPlaylist({ ...editingPlaylist, dominant_color: e.target.value })}
                      className="w-24 px-2 py-1 bg-black border border-zinc-800 rounded text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Liner Notes & Historia */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  <span>3. Liner Notes & Memoria Conceptual</span>
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">Texto largo para profundizar en la historia de la selección</span>
              </div>

              <textarea
                rows={5}
                value={editingPlaylist.story || ''}
                onChange={(e) => setEditingPlaylist({ ...editingPlaylist, story: e.target.value })}
                placeholder="Escribe la historia detrás de este ciclo o lanzamiento: por qué estas canciones representaron esta etapa, anécdotas o reflexiones de escucha..."
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 font-sans leading-relaxed"
              />
            </div>

            {/* 4. Enlaces y Etiquetas */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span>4. Plataformas Externas & Etiquetas</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                    Enlace de la Playlist en Spotify:
                  </label>
                  <input
                    type="url"
                    placeholder="https://open.spotify.com/playlist/..."
                    value={editingPlaylist.spotify_url || ''}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, spotify_url: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                    Enlace de la Playlist en YouTube:
                  </label>
                  <input
                    type="url"
                    placeholder="https://music.youtube.com/playlist?list=..."
                    value={editingPlaylist.youtube_url || ''}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, youtube_url: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                    Etiquetas / Géneros (separadas por coma):
                  </label>
                  <input
                    type="text"
                    placeholder="TUNE TRACKER, METAL, ROCK, FAVORITOS"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. Tracklist de Tune Tracker & Notas de Curaduría */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Music className="w-3.5 h-3.5 text-zinc-400" />
                    <span>5. Tracklist de Tune Tracker & Notas por Canción</span>
                  </h3>
                  <p className="text-xs text-zinc-500 font-sans mt-0.5">
                    Estas canciones provienen de tu selección en Tune Tracker. Añade una nota personal o memoria curatorial a cada tema.
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {editingPlaylist.tracks?.length || 0} canciones
                </span>
              </div>

              <div className="space-y-3">
                {editingPlaylist.tracks && editingPlaylist.tracks.length > 0 ? (
                  editingPlaylist.tracks.map((track, idx) => (
                    <div 
                      key={track.id || idx}
                      className="p-3.5 rounded-lg bg-black border border-zinc-800 space-y-2 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-zinc-500 w-5">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-white">{track.title}</span>
                            <span className="text-xs text-zinc-400 ml-2">por {track.artist}</span>
                            {track.album && <span className="text-xs text-zinc-600 ml-2 font-mono">• {track.album}</span>}
                          </div>
                        </div>

                        {track.plays !== undefined && track.plays > 0 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                            <Play className="w-2.5 h-2.5 text-zinc-400 fill-zinc-400" />
                            <span>{track.plays} streams</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Escribe una nota curatorial para este tema (ej. por qué fue clave en este semestre)..."
                          value={track.notes || ''}
                          onChange={(e) => handleUpdateTrackNote(idx, e.target.value)}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-sans italic"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-zinc-500">
                    No hay pistas cargadas en esta playlist.
                  </div>
                )}
              </div>
            </div>

            {/* Botón de Guardado */}
            <div className="pt-6 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setEditingPlaylist(null); }}
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono uppercase text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Personalización en Base de Datos</span>
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
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold uppercase font-mono tracking-wider text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-400" />
                <span>Playlists Sincronizadas desde Tune Tracker ({playlists.length})</span>
              </h2>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Playlists registradas en la tabla <code className="text-zinc-300 font-mono">spotitracker_curator</code> en Supabase.
              </p>
            </div>

            <button
              onClick={loadPlaylists}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${syncing ? 'animate-spin' : ''}`} />
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
                    className="p-5 rounded-xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      {/* Portada Mini */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black border border-zinc-800 flex-shrink-0 flex items-center justify-center">
                        {playlist.cover_url ? (
                          <Image src={playlist.cover_url} alt="Cover" fill className="object-cover" />
                        ) : (
                          <Disc className="w-8 h-8 text-zinc-700" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-mono uppercase text-zinc-400">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                            {playlist.release_type || 'Semestral'}
                          </span>
                          {playlist.period_str && (
                            <>
                              <span>•</span>
                              <span>{playlist.period_str}</span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base font-semibold text-white font-sans">
                          {playlist.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
                          <span>{playlist.tracks?.length || 0} canciones</span>
                          {totalStreams > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-400 flex items-center gap-1">
                                <Play className="w-2.5 h-2.5" />
                                {totalStreams} streams
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
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Link
                        href={`/playlist/${playlist.slug}`}
                        className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Vista Pública</span>
                      </Link>

                      <button
                        onClick={() => handleEdit(playlist)}
                        className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-1.5 shadow"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Personalización</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 space-y-3">
                <Disc className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="font-mono text-xs text-zinc-400">
                  No se encontraron playlists en la base de datos de Tune Tracker.
                </p>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto font-sans">
                  Asegúrate de haber guardado tu selección semestral con "Guardar en la Nube" desde Tune Tracker.
                </p>
                <button
                  onClick={loadPlaylists}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white"
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
        <div className="max-w-2xl bg-[#121215] border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="pb-4 border-b border-zinc-800">
            <h2 className="text-base font-semibold uppercase font-mono tracking-wider text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>Perfil de Curador</span>
            </h2>
            <p className="text-xs text-zinc-400 font-sans mt-1">
              Personaliza cómo te ves en Molva como creador de Tune Tracker.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Foto de Perfil / Avatar:
              </label>
              <div className="flex items-center gap-5">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-black border border-zinc-700 flex-shrink-0 flex items-center justify-center">
                  {userProfile.avatarUrl ? (
                    <Image src={userProfile.avatarUrl} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-zinc-500" />
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
                      className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-mono text-zinc-200 transition-colors flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Subir Foto</span>
                    </button>
                    {userProfile.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setUserProfile((prev) => ({ ...prev, avatarUrl: '' }))}
                        className="px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-500 hover:text-red-400"
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
                    className="w-full px-3 py-1.5 bg-black border border-zinc-800 rounded text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Nombre Público:
                </label>
                <input
                  type="text"
                  value={userProfile.displayName || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Usuario (@):
                </label>
                <input
                  type="text"
                  disabled
                  value={userProfile.username}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded text-xs font-mono text-zinc-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Enlace de Spotify:
                </label>
                <input
                  type="url"
                  placeholder="https://open.spotify.com/user/..."
                  value={userProfile.spotifyUrl || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, spotifyUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Enlace de Last.fm:
                </label>
                <input
                  type="url"
                  placeholder="https://www.last.fm/user/Vrak_23"
                  value={userProfile.lastfmUrl || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, lastfmUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                Biografía del Curador:
              </label>
              <textarea
                rows={3}
                value={userProfile.bio || ''}
                onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-zinc-500 font-sans"
              />
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-2"
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
