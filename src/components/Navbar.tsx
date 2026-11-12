'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Disc, User, Lock, Sparkles } from 'lucide-react';
import { UserProfile } from '@/types';

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);

  const checkUser = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.authenticated && data.user) {
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
          setUser(parsed);
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

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#09090b]/85 border-b border-[#27272a]/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Lado Izquierdo: Logo */}
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-2.5 sm:gap-3 group transition-opacity hover:opacity-85"
          >
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-black/40 flex-shrink-0 group-hover:border-white/50 transition-colors">
              <Disc className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase hidden xs:block">Repositorio Sonoro</span>
              <span className="text-sm font-semibold tracking-tight text-white font-sans">MOLVA</span>
            </div>
          </Link>
        </div>

        {/* Lado Derecho: Navegación */}
        <nav className="flex items-center gap-3 sm:gap-4 text-xs font-mono uppercase tracking-wider">
          <Link 
            href="/" 
            className={`transition-colors ${pathname === '/' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            Explorar
          </Link>

          <span className="text-zinc-700">/</span>

          <Link 
            href="/u/Vrak_23" 
            className={`transition-colors ${pathname.startsWith('/u/') ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            Curador
          </Link>

          <span className="text-zinc-700">/</span>

          {user ? (
            <Link 
              href="/admin" 
              className={`flex items-center gap-2 px-2.5 py-1 rounded-md border transition-all ${
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
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span className="normal-case font-sans font-medium text-xs">
                Estudio
              </span>
            </Link>
          ) : (
            <Link 
              href="/admin" 
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
              title="Acceso al panel de curaduría"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Estudio</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
