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
        {/* Lado Izquierdo: Identidad de Molva */}
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-3 group transition-opacity hover:opacity-90"
            aria-label="Ir al inicio de Molva"
          >
            <Image
              src="/icon.svg"
              alt=""
              width={32}
              height={32}
              className="rounded-[9px] ring-1 ring-cyan-400/30 shadow-[0_0_16px_rgba(0,240,255,0.12)] transition-transform group-hover:scale-105"
              priority
            />

            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tracking-[0.25em] text-white font-sans uppercase">
                MOLVA
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
            </div>
          </Link>
        </div>

        {/* Lado Derecho: Acceso directo al Estudio */}
        <nav className="flex items-center">
          {user ? (
            <Link 
              href="/admin" 
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all ${
                pathname === '/admin'
                  ? 'bg-cyan-400 text-black font-semibold border-cyan-300 shadow-[0_0_16px_rgba(0,240,255,0.25)]'
                  : 'bg-[#121217] border-white/[0.12] text-zinc-200 hover:text-cyan-300 hover:border-cyan-400/40'
              }`}
            >
              {user.avatarUrl ? (
                <div className="relative w-4 h-4 rounded-full overflow-hidden border border-zinc-700 flex-shrink-0">
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/[0.12] bg-[#121217] text-[#8c8c96] hover:text-cyan-300 hover:border-cyan-400/40 transition-all text-xs font-mono"
              title="Acceso al Estudio"
            >
              <Lock className="w-3 h-3 text-cyan-400/70" />
              <span>Estudio</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
