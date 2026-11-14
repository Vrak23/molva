import type { Metadata } from 'next';
import { Roboto_Condensed } from 'next/font/google';
import { ArrowUpRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import './globals.css';

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  variable: '--font-roboto-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Molva',
  description: 'Visualizador y repositorio discográfico de playlists curadas en Tune Tracker.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Molva',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`dark scroll-smooth ${robotoCondensed.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${robotoCondensed.className} bg-[#060608] text-[#ffffff] flex flex-col min-h-screen selection:bg-white selection:text-black antialiased font-sans`}>
        <ServiceWorkerRegistration />
        {/* Barra de Navegación Tidal */}
        <Navbar />

        {/* Contenido Principal con espaciado fluido y responsive */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 relative z-10">
          {children}
        </main>

        {/* Pie de Página Estilo Tidal */}
        <footer className="w-full border-t border-white/[0.07] bg-[#060608]/90 py-8 sm:py-10 mt-16 sm:mt-24 text-xs font-mono text-[#8c8c96]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <span className="inline-block w-2 h-2 rounded-sm bg-white rotate-45 shadow-[0_0_8px_rgba(255,255,255,0.4)]"></span>
              <span className="tracking-wider uppercase text-zinc-300 font-semibold text-[11px]">Molva</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Visualizador Oficial de Curadurías Tune Tracker</span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-zinc-400">
              <span className="text-[11px] uppercase tracking-widest text-zinc-500">Tidal Black Edition</span>
              <span className="text-zinc-700">•</span>
              <a 
                href="https://spotify.com" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                Spotify <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </a>
              <span>•</span>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                YouTube <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
