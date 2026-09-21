'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Playlist, Track, UserProfile, ReleaseType } from '@/types';
import { getPlaylists, savePlaylist, deletePlaylist } from '@/lib/supabase';
import { extractDominantColor } from '@/lib/color-extract';
import { compressImage } from '@/lib/image-compress';
import { 
  User, 
  Plus, 
  Trash2, 
  Edit3, 
  UploadCloud, 
  DownloadCloud, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Disc, 
  Eye, 
  LogOut, 
  AlertCircle, 
  UserCheck, 
  Settings, 
  ExternalLink, 
  Layers, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

const RELEASE_TYPES: ReleaseType[] = ['LP', 'EP', 'Mixtape', 'Compilación', 'Sesión'];

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: '',
    displayName: '',
    email: '',
    bio: '',
    avatarUrl: '',
    spotifyUrl: '',
    lastfmUrl: '',
  });

  const [adminTab, setAdminTab] = useState<'playlists' | 'profile'>('playlists');

  // Formulario de Auth
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Datos
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Modal de importación
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Notificaciones
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Cargar sesión
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setAuthenticated(true);
          const usernameKey = `canon_profile_${data.user.username.toLowerCase()}`;
          const localProfile = localStorage.getItem(usernameKey);
          const mergedProfile = localProfile 
            ? { ...data.user, ...JSON.parse(localProfile) } 
            : data.user;
          setUserProfile(mergedProfile);
        }
      } catch {
        const local = localStorage.getItem('canon_user_session');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed && parsed.username) {
              setAuthenticated(true);
              const usernameKey = `canon_profile_${parsed.username.toLowerCase()}`;
              const localProfile = localStorage.getItem(usernameKey);
              const mergedProfile = localProfile 
                ? { ...parsed, ...JSON.parse(localProfile) } 
                : parsed;
              setUserProfile(mergedProfile);
            }
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // Cargar playlists
  useEffect(() => {
    if (authenticated) {
      loadPlaylists();
    }
  }, [authenticated]);

  const loadPlaylists = async () => {
    const data = await getPlaylists();
    setPlaylists(data);
  };

  const notifyAuthChange = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('canon_auth_change'));
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!identifierInput.trim() || !passwordInput.trim()) {
      setAuthError('Todos los campos son requeridos.');
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: identifierInput, 
          password: passwordInput,
          action: authMode
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Limpiar restos de cuentas anteriores
        localStorage.removeItem('canon_user_profile');

        const activeUser: UserProfile = {
          username: data.user.username,
          displayName: data.user.displayName || data.user.username,
          email: data.user.email,
          bio: data.user.bio || 'Curador en Molva.',
          avatarUrl: data.user.avatarUrl || '',
          spotifyUrl: data.user.spotifyUrl || '',
        };

        // Guardar sesión y perfil específico para este usuario
        localStorage.setItem('canon_user_session', JSON.stringify(activeUser));
        localStorage.setItem(`canon_profile_${activeUser.username.toLowerCase()}`, JSON.stringify(activeUser));

        setUserProfile(activeUser);
        setAuthenticated(true);
        notifyAuthChange();

        const successText = authMode === 'register'
          ? `¡Cuenta creada con éxito! Bienvenido, ${activeUser.displayName || activeUser.username}.`
          : `¡Sesión iniciada con éxito! Bienvenido, ${activeUser.displayName || activeUser.username}.`;

        setAuthSuccessMsg(successText);
        showNotification(successText);
      } else {
        setAuthError(data.error || 'Error de autenticación.');
      }
    } catch {
      const cleanUser = identifierInput.split('@')[0];
      const fallbackUser: UserProfile = {
        username: cleanUser,
        displayName: cleanUser,
        email: identifierInput,
      };

      localStorage.removeItem('canon_user_profile');
      localStorage.setItem('canon_user_session', JSON.stringify(fallbackUser));
      localStorage.setItem(`canon_profile_${fallbackUser.username.toLowerCase()}`, JSON.stringify(fallbackUser));

      setUserProfile(fallbackUser);
      setAuthenticated(true);
      notifyAuthChange();
      showNotification(`¡Bienvenido, ${cleanUser}!`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch {}
    localStorage.removeItem('canon_user_session');
    localStorage.removeItem('canon_user_profile');
    setAuthenticated(false);
    setUserProfile({ username: '' });
    setIdentifierInput('');
    setPasswordInput('');
    setAuthSuccessMsg('');
    notifyAuthChange();
    showNotification('Sesión cerrada correctamente.');
  };

  // Guardar perfil
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`canon_profile_${userProfile.username.toLowerCase()}`, JSON.stringify(userProfile));
    localStorage.setItem('canon_user_session', JSON.stringify(userProfile));
    notifyAuthChange();
    showNotification('Perfil actualizado con éxito.');
  };

  // Subir avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimizedBase64 = await compressImage(file, 400, 0.85);
      setUserProfile((prev) => ({ ...prev, avatarUrl: optimizedBase64 }));
      showNotification('Avatar cargado y optimizado.');
    } catch {
      showNotification('Error al procesar la imagen.');
    }
  };

  // Crear nuevo lanzamiento
  const handleCreateNew = () => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'p-' + Date.now();
    const today = new Date().toISOString().split('T')[0];

    setEditingPlaylist({
      id: newId,
      slug: '',
      title: '',
      description: '',
      story: '',
      cover_url: '',
      dominant_color: '#262626',
      spotify_url: '',
      youtube_url: '',
      tags: [],
      release_date: today,
      release_type: 'LP',
      catalog_number: '',
      creator_username: userProfile.username || 'curador',
      creator_name: userProfile.displayName || userProfile.username || 'Curador',
      creator_avatar: userProfile.avatarUrl || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tracks: [
        {
          id: 't-' + Date.now(),
          playlist_id: newId,
          position: 1,
          title: '',
          artist: '',
          notes: '',
        }
      ]
    });
    setIsFormOpen(true);
  };

  // Editar playlist
  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist({
      ...playlist,
      tracks: playlist.tracks ? [...playlist.tracks] : []
    });
    setIsFormOpen(true);
  };

  // Eliminar playlist
  const handleDelete = async (id: string, title: string) => {
    if (confirm(`¿Confirmas retirar del catálogo el lanzamiento "${title}"?`)) {
      await deletePlaylist(id);
      await loadPlaylists();
      showNotification('Lanzamiento eliminado.');
    }
  };

  // Subida de imagen de playlist
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
      showNotification('Portada cargada, optimizada y color calculado.');
    } catch {
      showNotification('Error al procesar la imagen.');
    }
  };

  // Importar desde Spotify / YouTube
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;

    setImporting(true);
    setImportError('');

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'No se pudo importar la playlist.');
      }

      const imported = result.data;
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'p-' + Date.now();
      const slug = imported.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const today = new Date().toISOString().split('T')[0];

      let dominantColor = '#262626';
      if (imported.cover_url) {
        dominantColor = await extractDominantColor(imported.cover_url);
      }

      setEditingPlaylist({
        id: newId,
        slug: slug || 'release-' + Date.now(),
        title: imported.title,
        description: imported.description || '',
        story: '',
        cover_url: imported.cover_url || '',
        dominant_color: dominantColor,
        spotify_url: imported.platform === 'spotify' ? importUrl : '',
        youtube_url: imported.platform === 'youtube' ? importUrl : '',
        tags: [imported.platform.toUpperCase()],
        release_date: today,
        release_type: (imported.tracks?.length || 0) > 6 ? 'LP' : 'EP',
        catalog_number: '',
        creator_username: userProfile.username || 'curador',
        creator_name: userProfile.displayName || userProfile.username || 'Curador',
        creator_avatar: userProfile.avatarUrl || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tracks: (imported.tracks || []).map((t: any, idx: number) => ({
          id: 't-' + Date.now() + '-' + idx,
          playlist_id: newId,
          position: idx + 1,
          title: t.title,
          artist: t.artist,
          duration_ms: t.duration_ms,
          spotify_track_id: t.spotify_track_id,
          youtube_video_id: t.youtube_video_id,
          notes: ''
        }))
      });

      setIsImportModalOpen(false);
      setIsFormOpen(true);
      setImportUrl('');
      const trackCount = imported.tracks ? imported.tracks.length : 0;
      showNotification(`Importación completada: ${trackCount} canciones autorellenadas.`);
    } catch (err: any) {
      setImportError(err.message || 'Error al importar.');
    } finally {
      setImporting(false);
    }
  };

  // Guardar lanzamiento
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist) return;

    if (!editingPlaylist.title.trim()) {
      alert('El título del lanzamiento es requerido.');
      return;
    }

    const finalSlug = editingPlaylist.slug.trim() 
      ? editingPlaylist.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : editingPlaylist.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const playlistToSave: Playlist = {
      ...editingPlaylist,
      slug: finalSlug,
      creator_username: userProfile.username || editingPlaylist.creator_username || 'curador',
      creator_name: userProfile.displayName || userProfile.username || 'Curador',
      creator_avatar: userProfile.avatarUrl || editingPlaylist.creator_avatar,
      tracks: (editingPlaylist.tracks || []).map((t, idx) => ({
        ...t,
        position: idx + 1
      }))
    };

    const res = await savePlaylist(playlistToSave);

    if (res.success) {
      await loadPlaylists();
      setIsFormOpen(false);
      setEditingPlaylist(null);
      showNotification('Lanzamiento publicado en el archivo.');
    } else {
      alert('Error al guardar: ' + res.error);
    }
  };

  // Gestión de Tracks
  const handleAddTrack = () => {
    if (!editingPlaylist) return;
    const currentTracks = editingPlaylist.tracks || [];
    const newTrack: Track = {
      id: 't-' + Date.now(),
      playlist_id: editingPlaylist.id,
      position: currentTracks.length + 1,
      title: '',
      artist: '',
      notes: '',
    };

    setEditingPlaylist({
      ...editingPlaylist,
      tracks: [...currentTracks, newTrack]
    });
  };

  const handleUpdateTrack = (index: number, field: keyof Track, value: any) => {
    if (!editingPlaylist || !editingPlaylist.tracks) return;
    const updated = [...editingPlaylist.tracks];
    updated[index] = { ...updated[index], [field]: value };
    setEditingPlaylist({ ...editingPlaylist, tracks: updated });
  };

  const handleRemoveTrack = (index: number) => {
    if (!editingPlaylist || !editingPlaylist.tracks) return;
    const updated = editingPlaylist.tracks.filter((_, i) => i !== index);
    setEditingPlaylist({ ...editingPlaylist, tracks: updated });
  };

  const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
    if (!editingPlaylist || !editingPlaylist.tracks) return;
    const tracks = [...editingPlaylist.tracks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tracks.length) return;

    const temp = tracks[index];
    tracks[index] = tracks[targetIndex];
    tracks[targetIndex] = temp;

    setEditingPlaylist({ ...editingPlaylist, tracks });
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

  // Vista de Login / Registro
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto py-10 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-md hover:border-zinc-600"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver Atrás</span>
          </button>

          <Link href="/" className="text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors">
            Explorar Catálogo
          </Link>
        </div>

        <div className="bg-[#121215] border border-zinc-800 rounded-xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center bg-black mx-auto">
              <User className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              {authMode === 'login' 
                ? 'Ingresa tus credenciales para administrar tus lanzamientos'
                : 'Únete a la comunidad de curadores de Molva'}
            </p>
          </div>

          <div className="flex border border-zinc-800 rounded-lg p-1 bg-black">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccessMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                authMode === 'login'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccessMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                authMode === 'register'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Mensaje de Éxito de Inicio de Sesión */}
          {authSuccessMsg && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 p-3 rounded-lg border border-emerald-900/60 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                Usuario o Correo:
              </label>
              <input
                type="text"
                required
                placeholder="ej. alexander_vance o correo@ejemplo.com"
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors placeholder-zinc-600 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                Contraseña:
              </label>
              <input
                type="password"
                required
                placeholder="Ingresa tu contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors placeholder-zinc-600 font-sans"
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
              {authMode === 'login' ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Iniciar Sesión</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Cuenta y Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Caja con credenciales demo visibles */}
          <div className="p-3 bg-black/60 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-400 space-y-1">
            <span className="text-zinc-500 block uppercase">Cuenta Demo Disponible:</span>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Usuario: <strong className="text-white font-mono">alexander_vance</strong></span>
              <span>Clave: <strong className="text-white font-mono">canon123</strong></span>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 text-center">
            <Link href="/" className="text-xs font-mono text-zinc-500 hover:text-white transition-colors">
              ← Volver al catálogo público
            </Link>
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
          <Check className="w-4 h-4" />
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
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Curador Conectado: @{userProfile.username}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                {userProfile.displayName || userProfile.username}
              </h1>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setAdminTab('playlists')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                adminTab === 'playlists' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mis Lanzamientos</span>
            </button>
            <button
              onClick={() => setAdminTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                adminTab === 'profile' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Perfil</span>
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

      {/* PESTAÑA PERFIL */}
      {adminTab === 'profile' && (
        <div className="max-w-2xl bg-[#121215] border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-semibold uppercase font-mono tracking-wider text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Perfil Público de Curador</span>
              </h2>
              <p className="text-xs text-zinc-400 font-sans mt-1">
                Ajusta tu nombre, foto y biografía visible.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAdminTab('playlists')}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">
                Foto de Perfil / Avatar
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
                      <span>Subir Imagen</span>
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
                  Nombre a Mostrar
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Alexander Vance"
                  value={userProfile.displayName || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, displayName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Nombre de Usuario (@)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. alexander_vance"
                  value={userProfile.username}
                  onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                  className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                Biografía / Manifiesto Musical
              </label>
              <textarea
                rows={3}
                placeholder="Breve descripción de tus influencias, gustos o criterio de selección..."
                value={userProfile.bio || ''}
                onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Enlace a Perfil de Spotify:
                </label>
                <input
                  type="url"
                  placeholder="https://open.spotify.com/user/..."
                  value={userProfile.spotifyUrl || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, spotifyUrl: e.target.value })}
                  className="w-full px-3 py-1.5 bg-black border border-zinc-800 rounded text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                  Enlace a Last.fm o Web:
                </label>
                <input
                  type="url"
                  placeholder="https://last.fm/user/..."
                  value={userProfile.lastfmUrl || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, lastfmUrl: e.target.value })}
                  className="w-full px-3 py-1.5 bg-black border border-zinc-800 rounded text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setAdminTab('playlists')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Lanzamientos</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg"
              >
                Guardar Perfil
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PESTAÑA LANZAMIENTOS */}
      {adminTab === 'playlists' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase font-mono tracking-wider text-white">
              Catálogo de Lanzamientos ({playlists.length})
            </h2>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Importar Enlace</span>
              </button>

              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Lanzamiento</span>
              </button>
            </div>
          </div>

          {/* Modal de Importación */}
          {isImportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
              <div className="max-w-lg w-full bg-[#121215] border border-zinc-800 rounded-xl p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                    Importar Playlist como Lanzamiento
                  </h3>
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="text-zinc-500 hover:text-white text-xs font-mono"
                  >
                    Cerrar [ESC]
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Pega un enlace de Spotify o YouTube para autorellenar la portada, el título y todas las canciones del lanzamiento automáticamente.
                </p>

                <form onSubmit={handleImport} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                      URL de la Playlist:
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://open.spotify.com/playlist/... o https://youtube.com/playlist?list=..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                    />
                  </div>

                  {importError && (
                    <div className="text-xs font-mono text-red-400 bg-red-950/40 p-2.5 rounded border border-red-900/60">
                      {importError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-3.5 py-2 rounded-lg bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={importing}
                      className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {importing ? 'Extrayendo canciones...' : 'Procesar e Importar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Formulario de Lanzamiento */}
          {isFormOpen && editingPlaylist && (
            <div className="bg-[#121215] border border-zinc-700 rounded-xl p-6 sm:p-8 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsFormOpen(false); setEditingPlaylist(null); }}
                    className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Volver a la lista"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-zinc-400" />
                    <span>{editingPlaylist.title ? `Editando: ${editingPlaylist.title}` : 'Nuevo Lanzamiento'}</span>
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingPlaylist(null); }}
                  className="text-xs font-mono text-zinc-500 hover:text-white"
                >
                  Cancelar y Cerrar
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                {/* 1. Metadatos de Lanzamiento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-black/40 border border-zinc-800 rounded-lg">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                      Tipo de Formato *
                    </label>
                    <select
                      value={editingPlaylist.release_type}
                      onChange={(e) => setEditingPlaylist({ ...editingPlaylist, release_type: e.target.value as ReleaseType })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                    >
                      {RELEASE_TYPES.map(type => (
                        <option key={type} value={type}>{type} (Lanzamiento)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                      Fecha de Creación / Lanzamiento *
                    </label>
                    <input
                      type="date"
                      required
                      value={editingPlaylist.release_date}
                      onChange={(e) => setEditingPlaylist({ ...editingPlaylist, release_date: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                      Código de Catálogo (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="ej. CANON-001"
                      value={editingPlaylist.catalog_number || ''}
                      onChange={(e) => setEditingPlaylist({ ...editingPlaylist, catalog_number: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                    />
                  </div>
                </div>

                {/* 2. Información Principal y Portada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                        Título del Álbum / Playlist *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingPlaylist.title}
                        onChange={(e) => setEditingPlaylist({ ...editingPlaylist, title: e.target.value })}
                        placeholder="Ej. Nocturnas de Otoño"
                        className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                        Slug / Identificador URL
                      </label>
                      <input
                        type="text"
                        value={editingPlaylist.slug}
                        onChange={(e) => setEditingPlaylist({ ...editingPlaylist, slug: e.target.value })}
                        placeholder="ej. nocturnas-de-otono"
                        className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                        Subtítulo / Breve Resumen
                      </label>
                      <textarea
                        rows={2}
                        value={editingPlaylist.description || ''}
                        onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                        placeholder="Atmósfera, concepto y selección sonora..."
                        className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                        Etiquetas / Géneros (separados por coma)
                      </label>
                      <input
                        type="text"
                        value={editingPlaylist.tags ? editingPlaylist.tags.join(', ') : ''}
                        onChange={(e) => setEditingPlaylist({ 
                          ...editingPlaylist, 
                          tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                        })}
                        placeholder="Ambient, Post-Punk, Jazz"
                        className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Artwork & Ambient Color */}
                  <div className="space-y-4">
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                      Artwork / Portada Oficial
                    </label>
                    
                    <div className="flex gap-4 items-start">
                      <div className="relative w-32 h-32 bg-black rounded-lg border border-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {editingPlaylist.cover_url ? (
                          <Image
                            src={editingPlaylist.cover_url}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Disc className="w-8 h-8 text-zinc-700" />
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
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
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg text-xs font-mono text-zinc-200 transition-colors"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Cargar Imagen</span>
                        </button>

                        <div>
                          <input
                            type="url"
                            placeholder="O pegar URL de imagen..."
                            value={editingPlaylist.cover_url || ''}
                            onChange={async (e) => {
                              const url = e.target.value;
                              const color = url ? await extractDominantColor(url) : '#262626';
                              setEditingPlaylist({ ...editingPlaylist, cover_url: url, dominant_color: color });
                            }}
                            className="w-full px-3 py-1.5 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-zinc-500">Color Ambient:</span>
                          <input
                            type="color"
                            value={editingPlaylist.dominant_color || '#262626'}
                            onChange={(e) => setEditingPlaylist({ ...editingPlaylist, dominant_color: e.target.value })}
                            className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                          />
                          <span className="text-[11px] font-mono text-zinc-400">{editingPlaylist.dominant_color}</span>
                        </div>
                      </div>
                    </div>

                    {/* Enlaces de Streaming */}
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                          Enlace a Playlist en Spotify:
                        </label>
                        <input
                          type="url"
                          value={editingPlaylist.spotify_url || ''}
                          onChange={(e) => setEditingPlaylist({ ...editingPlaylist, spotify_url: e.target.value })}
                          placeholder="https://open.spotify.com/playlist/..."
                          className="w-full px-3 py-1.5 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-zinc-500 mb-1">
                          Enlace a Playlist en YouTube:
                        </label>
                        <input
                          type="url"
                          value={editingPlaylist.youtube_url || ''}
                          onChange={(e) => setEditingPlaylist({ ...editingPlaylist, youtube_url: e.target.value })}
                          placeholder="https://www.youtube.com/playlist?list=..."
                          className="w-full px-3 py-1.5 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Liner Notes */}
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                    Liner Notes / Historia y Concepto del Lanzamiento:
                  </label>
                  <textarea
                    rows={5}
                    value={editingPlaylist.story || ''}
                    onChange={(e) => setEditingPlaylist({ ...editingPlaylist, story: e.target.value })}
                    placeholder="El libreto del álbum: origen de la selección, significado conceptual, proceso de curaduría..."
                    className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-sm text-zinc-200 leading-relaxed focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* 4. Tracklist con Notas */}
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold uppercase font-mono tracking-wider text-white">
                        Tracklist Oficial ({editingPlaylist.tracks?.length || 0} canciones)
                      </h3>
                      <p className="text-xs text-zinc-500 font-mono">
                        Notas individuales por canción
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddTrack}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Canción</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editingPlaylist.tracks || []).map((track, idx) => (
                      <div 
                        key={track.id || idx}
                        className="p-4 bg-black/60 border border-zinc-800 rounded-lg space-y-3 relative group/track"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-zinc-500 w-6">
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTrack(idx, 'up')}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-20"
                                title="Subir posición"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (editingPlaylist.tracks?.length || 1) - 1}
                                onClick={() => handleMoveTrack(idx, 'down')}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-20"
                                title="Bajar posición"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTrack(idx)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Eliminar tema"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              required
                              placeholder="Título de la Canción"
                              value={track.title}
                              onChange={(e) => handleUpdateTrack(idx, 'title', e.target.value)}
                              className="w-full px-3 py-1.5 bg-[#121215] border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-zinc-500"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              required
                              placeholder="Artista / Intérprete"
                              value={track.artist}
                              onChange={(e) => handleUpdateTrack(idx, 'artist', e.target.value)}
                              className="w-full px-3 py-1.5 bg-[#121215] border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-zinc-500"
                            />
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Nota o memoria sobre este track (opcional)..."
                            value={track.notes || ''}
                            onChange={(e) => handleUpdateTrack(idx, 'notes', e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#121215] border border-zinc-800 rounded text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 italic"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones Inferiores de Acción */}
                <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => { setIsFormOpen(false); setEditingPlaylist(null); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a la Lista</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg"
                  >
                    Publicar Lanzamiento
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Lanzamientos del Usuario */}
          <div className="bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Mis Lanzamientos Publicados ({playlists.filter(p => p.creator_username.toLowerCase() === userProfile.username.toLowerCase()).length})
              </h2>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {playlists
                .filter(p => p.creator_username.toLowerCase() === userProfile.username.toLowerCase())
                .map((playlist) => (
                <div 
                  key={playlist.id} 
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-12 h-12 rounded bg-black border border-zinc-800 overflow-hidden flex-shrink-0">
                      {playlist.cover_url ? (
                        <Image
                          src={playlist.cover_url}
                          alt={playlist.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <Disc className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                          {playlist.release_type || 'LP'}
                        </span>
                        <h3 className="text-sm font-semibold text-white truncate">
                          {playlist.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mt-0.5">
                        <span>@{playlist.creator_username}</span>
                        <span>•</span>
                        <span>{playlist.tracks?.length || 0} tracks</span>
                        <span>•</span>
                        <span>{playlist.release_date || 'Sin fecha'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/playlist/${playlist.slug}`}
                      target="_blank"
                      className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title="Ver lanzamiento"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleEdit(playlist)}
                      className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(playlist.id, playlist.title)}
                      className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {playlists.filter(p => p.creator_username.toLowerCase() === userProfile.username.toLowerCase()).length === 0 && (
                <div className="py-12 text-center text-xs font-mono text-zinc-500">
                  Aún no has publicado ningún lanzamiento con esta cuenta. Haz clic en "Nuevo Lanzamiento" o "Importar Enlace" para publicar el primero.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
