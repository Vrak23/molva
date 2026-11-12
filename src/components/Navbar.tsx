'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Lock, Sparkles } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#060608]/80 border-b border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
        {/* Lado Izquierdo: Logotipo Estilo Tidal (Rombo Geométrico) */}
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-3 group transition-opacity hover:opacity-90"
          >
            {/* Ícono de rombos geométricos inspirado en Tidal */}
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-white rotate-45 transform transition-transform group-hover:scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
              <div className="w-2.5 h-2.5 bg-white/70 rotate-45 transform transition-transform group-hover:scale-110" />
            </div>

            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold tracking-[0.22em] text-white font-sans uppercase">
                MOLVA
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#8c8c96] uppercase hidden xs:block -mt-0.5">
                Tune Tracker Repository
              </span>
            </div>
          </Link>
        </div>

        {/* Lado Derecho: Navegación de Alta Fidelidad */}
        <nav className="flex items-center gap-2 sm:gap-6 text-xs font-mono uppercase tracking-[0.14em]">
          <Link 
            href="/" 
            className={`px-2.5 py-1.5 rounded transition-all duration-200 relative ${
              pathname === '/' 
                ? 'text-white font-semibold' 
                : 'text-[#8c8c96] hover:text-white'
            }`}
          >
            <span>Explorar</span>
            {pathname === '/' && (
              <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            )}
          </Link>

          <Link 
            href="/u/Vrak_23" 
            className={`px-2.5 py-1.5 rounded transition-all duration-200 relative ${
              pathname.startsWith('/u/') 
                ? 'text-white font-semibold' 
                : 'text-[#8c8c96] hover:text-white'
            }`}
          >
            <span>Curador</span>
            {pathname.startsWith('/u/') && (
              <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
            )}
          </Link>

          {user ? (
            <Link 
              href="/admin" 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                pathname === '/admin'
                  ? 'bg-white text-black font-semibold border-white shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                  : 'bg-[#121217] border-white/[0.12] text-zinc-200 hover:text-white hover:border-white/30'
              }`}
            >
              {user.avatarUrl ? (
                <div className="relative w-4 h-4 rounded-full overflow-hidden border border-zinc-700 flex-shrink-0">
                  <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
                </div>
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span className="normal-case font-sans font-medium text-xs hidden sm:inline">
                Estudio
              </span>
            </Link>
          ) : (
            <Link 
              href="/admin" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.12] bg-[#121217] text-[#8c8c96] hover:text-white hover:border-white/30 transition-all"
              title="Acceso al Estudio"
            >
              <Lock className="w-3 h-3 text-[#8c8c96]" />
              <span className="hidden sm:inline">Estudio</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
