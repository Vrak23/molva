import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Molva — Plataforma de Playlists & Lanzamientos Sonoros',
  description: 'Comunidad abierta de curadores musicales, lanzamientos tipo álbum, conceptos y notas de producción.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#09090b] text-[#fafafa] flex flex-col min-h-screen selection:bg-white selection:text-black">
        {/* Cabecera de Plataforma */}
        <Navbar />

        {/* Contenido Principal */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 relative">
          {children}
        </main>

        {/* Pie de Página */}
        <footer className="w-full border-t border-[#27272a]/40 py-8 mt-20 text-xs font-mono text-zinc-500">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              <span>Molva • Plataforma Comunitaria de Playlists & Lanzamientos</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-500">
              <span>Edición Minimalista B&W</span>
              <span>•</span>
              <a 
                href="https://spotify.com" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                Spotify <ArrowUpRight className="w-3 h-3" />
              </a>
              <span>•</span>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                YouTube <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
