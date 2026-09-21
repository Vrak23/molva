'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Disc, User, LogIn } from 'lucide-react';
import { UserProfile } from '@/types';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  const checkUser = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.authenticated && data.user) {
        // Buscar perfil específico para este nombre de usuario
        const usernameKey = `canon_profile_${data.user.username.toLowerCase()}`;
        const localProfile = localStorage.getItem(usernameKey);
        if (localProfile) {
          try {
            const parsed = JSON.parse(localProfile);
            setUser({ ...data.user, ...parsed });
            return;
          } catch {}
        }
        setUser(data.user);
        return;
      }
    } catch {}

    // Fallback de sesión local
    const localSession = localStorage.getItem('canon_user_session');
    if (localSession) {
      try {
        const parsed = JSON.parse(localSession);
        if (parsed && parsed.username) {
          const usernameKey = `canon_profile_${parsed.username.toLowerCase()}`;
          const localProfile = localStorage.getItem(usernameKey);
          const customProfile = localProfile ? JSON.parse(localProfile) : {};
          setUser({ ...parsed, ...customProfile });
          return;
        }
      } catch {}
    }

    setUser(null);
  };

  useEffect(() => {
    checkUser();

    const handleStorage = () => checkUser();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('canon_auth_change', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('canon_auth_change', handleStorage);
    };
  }, [pathname]);

  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#09090b]/80 border-b border-[#27272a]/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Lado Izquierdo: Logo */}
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-2.5 sm:gap-3 group transition-opacity hover:opacity-80"
          >
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-black/40 flex-shrink-0">
              <Disc className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-mono tracking-widest text-zinc-400 uppercase hidden xs:block">Biblioteca Sonora</span>
              <span className="text-sm font-semibold tracking-tight text-white">MOLVA</span>
            </div>
          </Link>
        </div>

        {/* Lado Derecho: Navegación y Cuenta Activa */}
        <nav className="flex items-center gap-3 sm:gap-4 text-xs font-mono uppercase tracking-wider">
          <Link 
            href="/" 
            className={`transition-colors ${pathname === '/' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            Explorar
          </Link>

          <span className="text-zinc-700">/</span>

          {user ? (
            <Link 
              href="/admin" 
              className={`flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-md border transition-all ${
                pathname === '/admin'
                  ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600'
              }`}
            >
              {user.avatarUrl ? (
                <div className="relative w-4 h-4 rounded-full overflow-hidden border border-zinc-600 flex-shrink-0">
                  <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
                </div>
              ) : (
                <User className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span className="truncate max-w-[85px] sm:max-w-[130px] normal-case font-sans font-medium text-xs">
                {user.displayName || user.username}
              </span>
            </Link>
          ) : (
            <Link 
              href="/admin" 
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-zinc-500" />
              <span>Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
